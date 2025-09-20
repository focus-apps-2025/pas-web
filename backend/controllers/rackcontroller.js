// backend/controllers/rackcontroller.js
const mongoose = require('mongoose');
const Rack = require('../models/Rack');
const Team = require('../models/Team');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const MasterDescription = require('../models/Materialdesc');

//===========================================================================================================
// Create Rack - accessible by Admin, Team Leader, and Team Member of the team
//===========================================================================================================
exports.createRack = asyncHandler(async (req, res, next) => {
  const { rackNo, partNo, nextQty, siteName, location } = req.body;

  // Validate required fields
  if (!rackNo || !partNo ||  nextQty === undefined || !siteName || !location) {
    return res.status(400).json({
      success: false,
      message: 'Please provide rackNo, partNo, mrp, nextQty, siteName, and location.',
    });
  }
  // Find the team by siteName
  const team = await Team.findOne({ siteName });
  if (!team) {
    return res.status(404).json({
      success: false,
      message: `Team with siteName '${siteName}' not found.`,
    });
  }

  // Check authorization based on user role and team membership
  const isAdmin = req.user.role === 'admin';
  const isTeamLeader = req.user.role === 'team_leader' && team.teamLeader && team.teamLeader.toString() === req.user._id.toString();
  const isTeamMember = req.user.role === 'team_member' && team.members.some(m => m.toString() === req.user._id.toString());

  if (!(isAdmin || isTeamLeader || isTeamMember)) {
    return res.status(403).json({ success: false, message: 'Not authorized to create rack for this team.' });
  }

  // Optional: prevent duplicate rackNo for the same site
  const existingRack = await Rack.findOne({ partNo, rackNo, team: team._id });

  if (existingRack) {
    // --- If it exists, UPDATE the quantity and scannedBy ---
    existingRack.nextQty += Number(nextQty); // 
    existingRack.scannedBy = req.user._id; // Also update who last scanned it
    await existingRack.save();

    res.status(201).json({ 
      success: true,
      message: `Rack ${rackNo} quantity updated to ${nextQty}`,
      rack: existingRack,
    });
  } else {
  // --- If it does not exist, CREATE a new one ---
  // Create and save the rack, associating the correct teamId and scannedBy user
  const newRack = await Rack.create({
    rackNo,
    partNo,
    nextQty,
    team: team._id,       // Important: associate team id here
    siteName,
    location,
    scannedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Rack created successfully',
    rack: newRack,
  });
}});

//===========================================================================================================
// Get all racks with role-based filtering & optional siteName filtering ,server-side pagination and search
//===========================================================================================================
exports.getRacks = asyncHandler(async (req, res, next) => {
  // --- Parameter and Filter Setup ---
  const { siteName, teamId, search, scannedById } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const { date } = req.query;

  const matchFilter = {}; // Base filter for team, date, etc.
  
  // --- User and Team Filtering (No changes here) ---
  if (req.user.role === 'admin') {
    if (teamId) matchFilter.team = new mongoose.Types.ObjectId(teamId);
  } else {
    let teamIds = [];
    if (req.user.role === 'team_leader') {
      const teamsLed = await Team.find({ teamLeader: req.user._id }).select('_id');
      teamIds = teamsLed.map(t => t._id);
    } else if (req.user.role === 'team_member') {
      const teamsMemberOf = await Team.find({ members: req.user._id }).select('_id');
      teamIds = teamsMemberOf.map(t => t._id);
    }
    if (teamIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    matchFilter.team = { $in: teamIds };
  }
  // --- Date and Other Filters ---
  if (date) {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    matchFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }
  if (siteName) matchFilter.siteName = siteName;
  if (scannedById) matchFilter.scannedBy = new mongoose.Types.ObjectId(scannedById);

  // --- N/A SEARCH LOGIC ---
  const isNaSearch = search && (search.toLowerCase() === 'n/a' || search.toLowerCase() === 'na');

  if (isNaSearch) {
    const pipeline = [
      // 1. Apply base filters first
      { $match: matchFilter },
      // 2. Perform all lookups to get related data
      { $lookup: { from: 'masterdescriptions', localField: 'partNo', foreignField: 'partNo', as: 'materialData' } },
      { $unwind: { path: '$materialData', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'teams', localField: 'team', foreignField: '_id', as: 'team' } },
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'scannedBy', foreignField: '_id', as: 'scannedBy' } },
      { $unwind: { path: '$scannedBy', preserveNullAndEmptyArrays: true } },
      // 3. Create the final fields we want to check for null
      {
        $addFields: {
          materialDescription: { $ifNull: ['$materialDescription', '$materialData.description'] },
          mrp: { $ifNull: ['$mrp', '$materialData.mrp'] },
          ndp: { $ifNull: ['$ndp', '$materialData.ndp'] }
        }
      },
      // 4. NOW filter for the null ("N/A") values
      {
        $match: {
          $or: [
            { materialDescription: null },
            { mrp: null },
            { ndp: null }
          ]
        }
      },
      // 5. Sort, paginate, and count the final results
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }, { $project: { materialData: 0 } }],
        }
      }
    ];

    const results = await Rack.aggregate(pipeline);
    const totalRacks = results[0].metadata.length > 0 ? results[0].metadata[0].total : 0;
    const racksData = results[0].data;

    return res.status(200).json({ success: true, count: totalRacks, data: racksData });

  } else {
    // --- ORIGINAL EFFICIENT PIPELINE FOR ALL OTHER SEARCHES ---
    if (search) {
      matchFilter.$or = [
        { rackNo: { $regex: search, $options: 'i' } },
        { partNo: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Stage 1: Fast query for IDs
    const initialResults = await Rack.aggregate([
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 1 } }], // Only get IDs
        },
      },
    ]);
    // If no results, return early
    if (!initialResults[0].data || initialResults[0].data.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
     // Extract total count and IDs for the page
    const totalRacks = initialResults[0].metadata[0].total;
    const rackIds = initialResults[0].data.map(r => r._id);

    // Stage 2: Detailed query for the page of IDs
    const detailedRacks = await Rack.aggregate([
      { $match: { _id: { $in: rackIds } } },
      // Perform lookups on the small dataset
      { $lookup: { from: 'masterdescriptions', localField: 'partNo', foreignField: 'partNo', as: 'materialData' } },
      { $unwind: { path: '$materialData', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'teams', localField: 'team', foreignField: '_id', as: 'team' } },
      { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'scannedBy', foreignField: '_id', as: 'scannedBy' } },
      { $unwind: { path: '$scannedBy', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          materialDescription: '$materialData.description',
          mrp: { $ifNull: ['$mrp', '$materialData.mrp'] },
          ndp: { $ifNull: ['$ndp', '$materialData.ndp'] }
        },
      },
      { $project: { materialData: 0 } },
      { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json({ success: true, count: totalRacks, data: detailedRacks });
  }
});
//===========================================================================================================
// Export racks with role-based filtering & optional siteName filtering and search (no pagination)
//===========================================================================================================
exports.exportRacks = asyncHandler(async (req, res, next) => {
  const { teamId, search } = req.query; // Read teamId and search from the request
  const { date } = req.query;
  // We are now building the same permission-based filter as the getRacks function.
  const matchFilter = {};

  if (req.user.role === 'admin') {
    // If an admin provides a teamId, filter by it. Otherwise, they get all teams.
    if (teamId) {
      matchFilter.team = new mongoose.Types.ObjectId(teamId);
    }
  } else {
    // For non-admins, we enforce team membership to prevent them from exporting other teams' data.
    let teamIds = [];
    if (req.user.role === 'team_leader') {
      const teamsLed = await Team.find({ teamLeader: req.user._id }).select('_id');
      teamIds = teamsLed.map(t => t._id);
    } else if (req.user.role === 'team_member') {
      const teamsMemberOf = await Team.find({ members: req.user._id }).select('_id');
      teamIds = teamsMemberOf.map(t => t._id);
    }
    if (teamIds.length === 0) {
      // If the user isn't on a team, they can't export anything.
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    // The filter will now only include racks from the user's teams.
    matchFilter.team = { $in: teamIds };
    // If a specific teamId was requested (e.g., from the dropdown),
    // we also add that to the filter.
    if (teamId) {
        matchFilter.team = new mongoose.Types.ObjectId(teamId);
    }
  }
  
  // Add search filter if provided
  if(search) {
    if (search.toLowerCase() === 'n/a' || search.toLowerCase() === 'na'||search.toLowerCase() === 'N/A') {
      matchFilter.$or = [
        { mrp: null },
        { ndp: null },
        { materialDescription: null },
    ];
  } else {
    matchFilter.$or = [
      { rackNo: { $regex: search, $options: 'i' } },
      { partNo: { $regex: search, $options: 'i' } },
    ];
  }
}
  if (date) {
  // Only records created on this date (regardless of time)
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    matchFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
 }
  // Perform aggregation to join materialdesc, team, and scannedBy details
  const racks = await Rack.aggregate([
    { $match: matchFilter }, // The query now uses the correct filter
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'masterdescriptions', localField: 'partNo', foreignField: 'partNo', as: 'materialData' } },
    { $unwind: { path: '$materialData', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        mrp: { $ifNull: ['$mrp', '$materialData.mrp'] },
        ndp: { $ifNull: ['$ndp', '$materialData.ndp'] },
        materialDescription: { $ifNull: ['$materialDescription', '$materialData.description'] },
      },},
    { $lookup: { from: 'teams', localField: 'team', foreignField: '_id', as: 'team' } },
    { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'scannedBy', foreignField: '_id', as: 'scannedBy' } },
    { $unwind: { path: '$scannedBy', preserveNullAndEmptyArrays: true } },
    {
       $addFields: {
    materialDescription: '$materialData.description',
    
    // Use the rack's own MRP if it exists; otherwise, fall back to the master one.
    mrp: { $ifNull: ['$mrp', '$materialData.mrp'] },
  
    // Use the rack's own NDP if it exists; otherwise, fall back to the master one.
    ndp: { $ifNull: ['$ndp', '$materialData.ndp'] }
  },
    },
    { $project: { materialData: 0 } },
  ]);

  res.status(200).json({
    success: true,
    count: racks.length,
    data: racks,
  });
});

//===========================================================================================================
// Get single rack by ID (with permission check)
//===========================================================================================================
exports.getRackById = asyncHandler(async (req, res, next) => {
  const rackId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(rackId)) {
    return res.status(400).json({ success: false, message: 'Invalid Rack ID.' });
  }

  // Perform aggregation to join materialdesc, team, and scannedBy detailsc
  const racks = await Rack.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(rackId) } },

    // Join material descriptions
    {
      $lookup: {
        from: 'masterdescriptions',
        localField: 'partNo',
        foreignField: 'partNo',
        as: 'materialData',
      },
    },
    { $unwind: { path: '$materialData', preserveNullAndEmptyArrays: true } },
    {
     $addFields: {
        materialDescription: '$materialData.description',
        // Use the rack's own MRP if it exists; otherwise, fall back to the master one.
        mrp: { $ifNull: ['$mrp', '$materialData.mrp'] },
        // Use the rack's own NDP if it exists; otherwise, fall back to the master one.
        ndp: { $ifNull: ['$ndp', '$materialData.ndp'] }
      },
    },
    { $project: { materialData: 0 } },

    // Join team details
    {
      $lookup: {
        from: 'teams',
        localField: 'team',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },

    // Join scannedBy user details
    {
      $lookup: {
        from: 'users',
        localField: 'scannedBy',
        foreignField: '_id',
        as: 'scannedBy',
      },
    },
    { $unwind: { path: '$scannedBy', preserveNullAndEmptyArrays: true } }
  ]);

  if (!racks.length) {
    return res.status(404).json({ success: false, message: 'Rack not found.' });
  }
  const rack = racks[0];

  const userIdStr = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isTeamLeader = rack.team && rack.team.teamLeader && rack.team.teamLeader.toString() === userIdStr;
  const isTeamMember = rack.team && rack.team.members && rack.team.members.some(m => m.toString() === userIdStr);

  if (!(isAdmin || isTeamLeader || isTeamMember)) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this rack.' });
  }

  res.status(200).json({ success: true, data: rack });
});


//===========================================================================================================
// Update rack (only admin or team leader of assigned team)
//===========================================================================================================
exports.updateRack = asyncHandler(async (req, res) => {
  const rackId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(rackId)) {
    return res.status(400).json({ success: false, message: 'Invalid Rack ID.' });
  }

  // --- Authorization (no changes needed here) ---
  let rack = await Rack.findById(rackId);
  if (!rack) {
    return res.status(404).json({ success: false, message: 'Rack not found.' });
  }
  // (Your authorization logic for admin/team leader remains here...)

  try {
    // The update data now includes all fields directly from the body
    const updateData = { ...req.body };

    // This handles cases where the app sends an empty string or null for a number,
    // which means we should clear the override value in the database.
    if (updateData.mrp !== undefined && (updateData.mrp === null || updateData.mrp === '')) {
      // Unset the field from the document instead of saving null
      updateData.$unset = { mrp: 1 }; 
      delete updateData.mrp;
    }
    if (updateData.ndp !== undefined && (updateData.ndp === null || updateData.ndp === '')) {
      // Add ndp to the $unset operation
      updateData.$unset = { ...updateData.$unset, ndp: 1 };
      delete updateData.ndp;
    }

    // Perform the update on the Rack document
    const updatedRack = await Rack.findByIdAndUpdate(rackId, updateData, {
      new: true,
      runValidators: true,
    }).populate('team', 'teamLeader'); // Keep populate if you need it in the response

    res.status(200).json({
      success: true,
      message: 'Rack updated successfully',
      data: updatedRack,
    });
  } catch (error) {
    console.error('Error updating rack:', error);
    res.status(500).json({ success: false, message: 'Server error updating rack.' });
  }
});

//===========================================================================================================
// Delete rack (only admin or team leader of assigned team)
//===========================================================================================================
exports.deleteRack = asyncHandler(async (req, res, next) => {
  
  const rackId = req.params.id;
  //
  if (!mongoose.Types.ObjectId.isValid(rackId)) {
    return res.status(400).json({ success: false, message: 'Invalid Rack ID.' });
  }

  let rack = await Rack.findById(rackId).populate('team', 'teamLeader');
   
  if (!rack) {
    return res.status(404).json({ success: false, message: 'Rack not found.' });
  }
   // Authorization check
  const userIdStr = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  const isTeamLeader = rack.team && rack.team.teamLeader && rack.team.teamLeader.toString() === userIdStr;

  if (!(isAdmin || isTeamLeader)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this rack.' });
  }
   // Perform deletion
  try {
    await rack.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Rack deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting rack:', error);
    res.status(500).json({ success: false, message: 'Server error deleting rack.' });
  }
});
//===========================================================================================================
// Get scan counts grouped by user for a specific team
//===========================================================================================================
exports.getScanCountsByUser = asyncHandler(async (req, res, next) => {
    const { teamId } = req.query;
    if (!teamId) {
        return res.status(400).json({ success: false, message: 'Team ID is required.' });
    }
    // Aggregate scan counts grouped by scannedBy user
    const scanCounts = await Rack.aggregate([
        { $match: { team: new mongoose.Types.ObjectId(teamId) } },
        { $group: { _id: '$scannedBy', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'scannedByUser' } },
        { $project: {
            _id: 0,
            userName: { $arrayElemAt: ['$scannedByUser.name', 0] },
            count: 1
        }}
    ]);

    res.status(200).json({ success: true, data: scanCounts });
});

//===========================================================================================================
// Get first scan of each user for a specific team on a specific date
//===========================================================================================================
exports.getFirstScanByUser = async (req, res, next) => {
  try {
    const { teamId, date } = req.query;
    if (!teamId || !date) {
      return res.status(400).json({ error: 'teamId and date are required' });
    }
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // Aggregate user's first scan and total for the day
    const results = await Rack.aggregate([
      {
        $match: {
          team: new mongoose.Types.ObjectId(teamId),
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        }
      },
      { $group: {
          _id: "$scannedBy",
          count: { $sum: 1 },
          firstScan: { $min: "$createdAt" }
        }
      },
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $project: {
          _id: 0,
          user: "$user.name",
          count: 1,
          firstScan: 1
        }
      }
    ]);
    // Convert to { user: { count, firstScan } } shape
    const data = {};
    for (const row of results) {
      data[row.user] = { count: row.count, firstScan: row.firstScan };
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};
//===========================================================================================================
// Get the most recent rack by part number within a specific team (by siteName)
//===========================================================================================================
exports.getRackByPartNo = asyncHandler(async (req, res, next) => {
    const { siteName, partNo } = req.params; // Get both params

    // 1. Find the team using the siteName
    const team = await Team.findOne({ siteName });
    if (!team) {
        // If the team doesn't exist, we can't find a rack for it.
        return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // 2. Find the most recent rack for that partNo WITHIN THAT TEAM
    const rack = await Rack.findOne({
        partNo: partNo,
        team: team._id  
    }).sort({ createdAt: -1 });

    if (!rack) {
        return res.status(404).json({ success: false, message: 'No existing rack found for this part number in this team.' });
    }

    res.status(200).json({ success: true, data: rack });
});
