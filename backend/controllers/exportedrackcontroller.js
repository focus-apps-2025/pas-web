// backend/controllers/exportedrackcontroller.js
const ExportedRackSnapshot = require('../models/ExportedRack');
const Team = require('../models/Team');
const asyncHandler = require('../middleware/asyncHandler');
//===========================================================================================================
// @desc    Create multiple exported rack snapshots @route   POST /api/exportedracks @access  Private (admin or team leader)
//===========================================================================================================
exports.createExportedSnapshots = asyncHandler(async (req, res, next) => {
    const { snapshots, teamId, siteName } = req.body;
    const exportedBy = req.user._id;

    if (!snapshots || !Array.isArray(snapshots) || snapshots.length === 0) {
        return res.status(400).json({ success: false, message: 'No snapshot data provided.' });
    }
    if (!teamId || !siteName) {
        return res.status(400).json({ success: false, message: 'Team ID and Site Name are required.' });
    }

    const teamExists = await Team.findById(teamId);
    if (!teamExists) {
        return res.status(404).json({ success: false, message: `Team with ID ${teamId} not found.` });
    }

    const isAuthorized = req.user.role === 'admin' || 
                         (teamExists.teamLeader && teamExists.teamLeader.toString() === exportedBy.toString());

    if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Not authorized for this team.' });
    }

    const snapshotsToSave = snapshots.map(snapshot => ({
        ...snapshot, // Includes sNo, rackNo, partNo, etc. from the client
        team: teamId,
        siteName: siteName,
        exportedBy: exportedBy
    }));

    try {
        const result = await ExportedRackSnapshot.insertMany(snapshotsToSave);
        res.status(201).json({
            success: true,
            message: `${result.length} rack snapshots saved successfully.`,
            count: result.length
        });
    } catch (error) {
        console.error("Error saving exported rack snapshots:", error);
        res.status(500).json({ success: false, message: 'Server error saving snapshots.' });
    }
});