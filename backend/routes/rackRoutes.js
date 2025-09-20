// backend/routes/rackRoutes.js
const express = require('express');
const {
    createRack,
    getRacks,
    getRackById,
    updateRack,
    deleteRack,
    exportRacks,
    getScanCountsByUser,
    getFirstScanByUser,
     getRackByPartNo,
} = require('../controllers/rackcontroller');
// Auth middleware
const { protect, authorize } = require('../middleware/authMiddleware');
// Initialize router
const router = express.Router();

//This route handles GET for the paginated list and POST to create a new rack.
router.route('/')
    .post(protect, authorize(['admin', 'team_leader', 'team_member']), createRack)
    .get(protect, authorize(['admin', 'team_leader', 'team_member']), getRacks);
// This is the new, separate route for the download feature.
// It MUST be defined before the '/:id' route.
router.route('/export')
    .get(protect, authorize(['admin', 'team_leader', 'team_member']), exportRacks);
router.route('/scancounts').get(protect, getScanCountsByUser);
// New route to get the first scan by user
router.route('/first-scan-by-user').get(protect, authorize(['admin', 'team_leader', 'team_member']),getFirstScanByUser);
// Route to get rack by part number and site name
router.route('/team/:siteName/part/:partNo') 
    .get(protect, authorize(['admin', 'team_leader', 'team_member']), getRackByPartNo); 
//  This generic route for a single ID now comes last.
router.route('/:id')
    .get(protect, authorize(['admin', 'team_leader', 'team_member']), getRackById)
    .put(protect, authorize(['admin', 'team_leader']), updateRack)
    .delete(protect, authorize(['admin', 'team_leader']), deleteRack);

module.exports = router;