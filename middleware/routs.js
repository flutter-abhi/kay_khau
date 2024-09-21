const express = require('express');

const router = express.Router();
const { login, signup } = require('../controller/login');
const { addPreferenceList } = require('../controller/prefrencelist');
const { joinGroup } = require("../controller/joinGroup");
const { createGroup } = require("../controller/creategroup");
const { addFoodItems } = require("../controller/addFoodItems"); 

router.post('/login', login);
router.post('/signup', signup);
router.post('/add-preference-list', addPreferenceList);
router.post('/create-group', createGroup);
router.post('/join-group', joinGroup);
router.post('/add-food-items', addFoodItems);

module.exports = router;
