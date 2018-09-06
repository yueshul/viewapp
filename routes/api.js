const express = require('express');
const router = express.Router();
const basicAuth = require('basic-auth');
const dataservice = require('../services/dataservice');

const curr_username = 'yuebaker';
const curr_password = '123321';

/**
 * the basic authentication function used as middleware
 * @param req
 * @param res
 * @param next
 */
const auth = (req, res, next) => {
    const user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
        return;
    }
    if (user.name === curr_username && user.pass === curr_password) {
        next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
        return;
    }
};
/**
 * add authentication to all api calls
 */
router.all('/*', auth);

/**
 * This is the test api call.
 * */
router.get('/', (req, res, next) => {
    res.send('test for api call.');
});

router.get('/getmessages', (req, res) => {
    const keyword = req.query.search;
    console.log(keyword);
    let usernames = [];
    usernames.push(curr_username);
    // get all followee's username
    dataservice.getfollowings(curr_username).then((result) => {
        usernames = usernames.concat(result["followee_usernames"]);
        console.log(usernames);
        dataservice.getmessages(usernames, keyword).then((result) => {
            res.status(200);
            res.json(result);
        }, (err) => {
            res.status(400);
            res.json(err);
        });
    }, (err) => {
        res.status(400);
        res.json(err);
    });
});

/**
 * This is the api call to get a list of users which are following the current user.
 */
router.get('/getfollowers', (req, res) => {
    dataservice.getfollowers(curr_username).then((result) => {
        res.status(200);
        res.json(result);
    }, (err) => {
        res.status(400);
        res.json(err);
    });
});

/**
 * This is the api call to get a list of users which the current user is following.
 */
router.get('/getfollowings', (req, res) => {
    dataservice.getfollowings(curr_username).then((result) => {
        res.status(200);
        res.json(result);
    }, (err) => {
        res.status(400);
        res.json(err);
    });
});

/**
 * This is the api call for start following another user.
 */
router.get('/follow/:username',  (req, res) => {
    const followed_username = req.params.username;
    dataservice.follow(curr_username, followed_username).then((result) => {
        res.status(200);
        res.json(result);
    }, (err) => {
        res.status(400);
        res.json(err);
    });
});

/**
 * This is the api call for start unfollowing another user.
 * @type {Router|router|*}
 */
router.get('/unfollow/:username', (req, res) => {
    const followed_username = req.params.username;
    dataservice.unfollow(curr_username, followed_username).then((result) => {
        // console.log(result);
        res.status(200);
        res.json(result);
    }, (err) => {
        // console.log(err);
        res.status(400);
        res.json(err);
    });
});

/**
 * This is the api call to get the shortest distance from the current user
 * to the target user
 */
router.get('/getshortestdistance/:username', (req, res) => {
    const target_username = req.params.username;
    // use the bfs algorithm to find the shortest distance
    let ele_queue = [];
    let dis_queue = [];
    ele_queue.push(curr_username);
    dis_queue.push(0);
    bfs(ele_queue, dis_queue, target_username).then((result) => {
        res.status(200);
        res.json({shortest_distance : result});
    }, (err) => {
        if (err === -1) {
            res.status(200);
            res.json({message : "The user doesn't exist in your network!"});
        } else if (err === -2) {
            res.status(400);
            res.json({message : "Error in reading database!"});
        }
    });
});

function bfs(ele_queue, dis_queue, target_username) {
    return new Promise((resolve, reject) => {
        if (ele_queue.length === 0) {
            reject(-1);
            return;
        }
        let curr = ele_queue.shift();
        let curr_dis = dis_queue.shift();
        console.log(curr + "," + curr_dis);
        curr_dis++;
        dataservice.getfollowings(curr).then((result) => {
            let array = result['followee_usernames'];
            console.log(array);
            for (let i = 0; i < array.length; i++) {
                if (array[i] === target_username) {
                    resolve(curr_dis);
                    return;
                } else {
                    ele_queue.push(array[i]);
                    dis_queue.push(curr_dis);
                }
            }
            bfs(ele_queue, dis_queue, target_username).then((result) => {
                resolve(result);
            }, (err) => {
                reject(err);
            });
        }, (err) => {
            reject(-2);
        });
    });
}


module.exports = router;