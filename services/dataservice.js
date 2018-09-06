const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('twitter.db');


function getmessages(usernames, keyword) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM messages WHERE (';
        const len = usernames.length;
        for (let i = 0; i < len; i++) {
            if (i !== len - 1) {
                query += 'author = (?) OR ';
            } else {
                query += 'author = (?))'
            }
        }
        if (keyword) {
            query += " AND (body LIKE '%" + keyword + "%');";
        } else {
            query += ';';
        }
        console.log(query);
        db.all(query, usernames, (err, rows) => {
            if (err) {
                console.log(err);
                reject({message : 'Error in reading database!'});
            } else {
                resolve(rows);
            }
        });
    });
}

function getfollowers(username) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM relationship WHERE followee_username = (?);', [username], (err, rows) => {
            if (err) {
                reject({message : 'Error in reading database!'});
            } else {
                let result = {'follower_usernames' : []};
                rows.forEach((ele) => {
                    result['follower_usernames'].push(ele['follower_username']);
                });
                resolve(result);
            }
        });
    });
}
/**
 * This is the function to get all users that the current user is following.
 * @param username
 * @returns {Promise<any>}
 */
function getfollowings(username) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM relationship WHERE follower_username = (?);', [username], (err, rows) => {
            if (err) {
                reject({message : 'Error in reading database!'});
            } else {
                let result = {'followee_usernames' : []};
                rows.forEach((ele) => {
                    result['followee_usernames'].push(ele['followee_username']);
                });
                resolve(result);
            }
        });
    });
}
/**
 * This is the function call to follow one user.
 * @param follower
 * @param followed
 * @returns {Promise<any>}
 */
function follow(follower, followed) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM relationship WHERE follower_username = (?) AND followee_username = (?);', [follower, followed], (err, rows) => {
            if (err) {
                reject({message: 'Error in reading database!'});
            } else if (rows.length > 0) {
                reject({message: 'You have already been following this user!'});
            } else {
                db.all('SELECT * FROM users WHERE username = (?);', [followed], (err, rows) => {
                    if (err) {
                        reject({message: 'Error in reading database!'});
                    } else if (!rows || rows.length !== 1) {
                        reject({message: "The user you are going to follow doesn't exist!"});
                    } else if (rows[0]['username'] === follower) {
                        reject({message: 'You cannot follow yourself!'});
                    } else {
                        db.run('INSERT INTO relationship (follower_username, followee_username) VALUES ((?), (?));',
                            [follower, followed],
                            (err, rows) => {
                                if (err) {
                                    reject({message: 'Error in writing database!'});
                                } else {
                                    resolve({message: 'You have successfully followed ' + followed});
                                }
                            });
                    }
                });
            }
        });
    });
}
/**
 * This is the function for unfollowing a user.
 * @param follower
 * @param followed
 * @returns {Promise<any>}
 */
function unfollow(follower, followed) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM relationship WHERE followee_username = (?);', [followed], (err, rows) => {
            if (err) {
                reject({message : 'Error in reading database!'});
            } else if (!rows || !rows.length) {
                reject({message : 'No such followed user!'});
            } else {
                db.run('DELETE FROM relationship WHERE follower_username = (?) AND followee_username = (?);',
                    [follower, followed],
                    (err, rows) => {
                        if (err) {
                            reject({message : 'Error in reading database!'});
                        } else {
                            resolve({message : 'You have successfully unfollowed ' + followed});
                        }
                });
            }
        });
    });
}

module.exports = {
    unfollow,
    follow,
    getfollowings,
    getfollowers,
    getmessages
};