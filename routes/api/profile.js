const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const request = require('request');
const config = require('config');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route  GET api/profile/me
//@desc   Get current users profile
//@access Private
router.get('/me', auth, async (req, res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id})
            .populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: "There is no profile for this user" });
        }

        res.json(profile);

    } catch( error ){
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


//@route  POST api/profile
//@desc   Create or Update user profile
//@access Private

router.post('/', [auth, [
    check('status', 'Status is required')
        .not().
        isEmpty(),
    check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company, website, location, bio, status, githubusername, skills,
        youtube, facebook, twitter, instagram, linkedin
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company)    profileFields.company = company;
    if (website)    profileFields.website = website;
    if (location)   profileFields.location = location;
    if (bio)        profileFields.bio = bio;
    if (status)     profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)     profileFields.skills = skills.split(',')
    .map(skill => skill.trim());

    // BUILD SOCIAL OBJECT
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    

    try {
        let profile = await Profile.findOne( { user: req.user.id });
        if (profile) {
            // UPDATE 
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id},
                { $set: profileFields},
                { new: true }
            );
            return res.json(profile);
        }

        //CREATE
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
            
    } catch (error ) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


//@route  GET api/profile
//@desc   GET ALL PROFILES
//@access Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


//@route  GET api/profile/uer/:userid
//@desc   GET Profile by User id
//@access Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profiles = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar']);
        if (!profiles)  return res.status(400).json({ msg: 'Profile Not Found' });

        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        if (error.kind == 'ObjectId')   return res.status(400).json({ msg: 'Profile Not Found' });
        res.status(500).send('Server Error');
    }
});


//@route  DELETE api/profile
//@desc   Delete profile, user $ posts
//@access Private

router.delete('/', auth, async (req, res) => {
    try {
        //TODO - REMOVE USERS POSTS
        //Remove profile
        await Profile.findOneAndDelete({ user: req.user.id });
        //Remove User
        await User.findOneAndDelete({ _id : req.user.id });
        res.json({ msg: 'User Removed'}); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


//@route  PUT api/profile/experience
//@desc   Add Profile Experience
//@access Private


router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check("from", 'From date is required').not().isEmpty()
]], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors){
        return res.status(400).json({ errors: errors.array() });
    }
    const {title, company, location, from, to, current, description} = req.body;
    const newExp = { title, company, location, from, to, current, description};
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
    
});


//@route  DELETE api/profile/experience/:exp_id
//@desc   Delete experience from profile
//@access Private


router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});



//@route  PUT api/profile/experience
//@desc   Add Profile Experience
//@access Private


router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check("field", 'Field is required').not().isEmpty(),
    check("from", 'From is required').not().isEmpty()

]], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors){
        return res.status(400).json({ errors: errors.array() });
    }
    const {school, degree, field, from, to, current, description} = req.body;
    const newEdu = { school, degree, field, from, to, current, description};
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
    
});


//@route  DELETE api/profile/education/:exp_id
//@desc   Delete education from profile
//@access Private


router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        // Get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


//@route  GET api/profile/github/:username
//@desc   Get user repos from Github
//@access Public

router.get('github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
            sort=created:asc&client_id=${config.get('githubClientID')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };
        request(options, (error, response, body) => {
            console.log(response.statusCode);
            if (error)  console.error(error);
            if (response.statusCode !== 200 ) {
                res.status(404).json({ msg: 'No Github profile found' });
            }
            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;