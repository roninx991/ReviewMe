var date = new Date();
var express = require('express');
var mongodb = require('mongodb').MongoClient;

var yesnoRouter = express.Router();

var Web3 = require('web3');
var Contract = require('truffle-contract');
var path = require('path');

var provider = new Web3.providers.HttpProvider("http://localhost:8545");

// SAT Contract
var SATContractJSON = require(path.join(__dirname, '../../build/contracts/SARAToken.json'));
var SATContract = Contract(SATContractJSON);
SATContract.setProvider(provider);

// Main Contract
var MainContractJSON = require(path.join(__dirname, '../../build/contracts/MainContract.json'));
var MainContract = Contract(MainContractJSON);
MainContract.setProvider(provider);


var u_router = function(web3) {
    yesnoRouter.route("/")
        .post(function(req, res) {
            const url = 'mongodb://localhost:27017';
            mongodb.connect(url, { useNewUrlParser: true }, function(err, client) {
                if (err == undefined) {
                    console.log("Successfully connected to database.");

                    const db = client.db('NodeDemoWebApp');
                    const Reviews = db.collection('Reviews');
                    Reviews.insertOne({ hash: req.body.hashvalue, Reviewerid: req.user._id, Marks: req.body.marks, Comments: req.body.comments }, function(err, result) {
                        if (err == undefined) {
                            console.log("Successfully inserted Review in database");
                            SATContract.deployed().then(function(instance) {
                                console.log(req.user.address, req.user.pwd);
                                var x = web3.personal.unlockAccount(req.user.address, req.user.pwd);

                                return instance.transfer(web3.eth.accounts[0], 10, { from: req.user.address, gas: 100000 });

                            }).then(function(result) {
                                console.log("Reviewing cost successfully deducted");

                            }).catch(function(err) {
                                console.log("Cost deduction error: ", err);
                            });

                            MainContract.deployed().then(function(instance) {
                                web3.personal.unlockAccount(web3.eth.accounts[0], "123456");
                                instance.Review(req.body.hashvalue, req.user.address.toLowerCase(), { from: web3.eth.accounts[0], gas: 100000 }).then(function(result) {
                                    instance.giveMarks(req.body.hashvalue, req.body.marks, { from: web3.eth.accounts[0], gas: 100000 }).then(function(M) {
                                        instance.isReviewed.call(req.body.hashvalue).then(function(result1) {
                                            if (result1) {
                                                instance.getReviewers.call(req.body.hashvalue).then(function(result2) {
                                                    console.log("Reviewers List: ", result2);
                                                    instance.getMarks.call(req.body.hashvalue).then(function(result4) {
                                                        console.log("Marks: ", result4);

                                                        var creds = new Array();
                                                        instance.getCredibility.call(result2[0]).then(function(r0) {
                                                            creds.push(r0 > 0 ? r0 : 1);
                                                            instance.getCredibility.call(result2[1]).then(function(r1) {
                                                                creds.push(r1 > 0 ? r1 : 1);
                                                                instance.getCredibility.call(result2[2]).then(function(r2) {
                                                                    creds.push(r2 > 0 ? r2 : 1);
                                                                    instance.getCredibility.call(result2[3]).then(function(r3) {
                                                                        creds.push(r3 > 0 ? r3 : 1);
                                                                        instance.getCredibility.call(result2[4]).then(function(r4) {
                                                                            creds.push(r4 > 0 ? r4 : 1);
                                                                            var result3 = new Array();
                                                                            result3.push(parseInt(result4[0].toString()), parseInt(result4[1].toString()), parseInt(result4[2].toString()), parseInt(result4[3].toString()), parseInt(result4[4].toString()));
                                                                            var mean = parseInt((creds[0]*result3[0] + creds[1]*result3[1] + creds[2]*result3[2] + creds[3]*result3[3] + creds[4]*result3[4]) / (creds[0] + creds[1] + creds[2] + creds[3] + creds[4]));

                                                                            console.log("Mean is: ", mean);
                                                                            console.log("Result3 is: ", result3);

                                                                            instance.setRating(mean, req.body.hashvalue, { from: web3.eth.accounts[0], gas: 100000 }).then(function(R) {
                                                                                console.log("Rating of ", req.body.hashvalue, "is ", mean);
                                                                                instance.setCost(req.body.hashvalue, { from: web3.eth.accounts[0], gas: 100000 }).then(function(C) {
                                                                                    console.log("Cost of ", req.body.hashvalue, "is ", 50 + mean*5);

                                                                                    var status = mean > 5 ? 2 : 3;
                                                                                    instance.setStatus(req.body.hashvalue, status, { from: web3.eth.accounts[0], gas: 100000 }).then(function(C) {
                                                                                        console.log("Status of submission set to: ", status);

                                                                                    }).catch(function(err) {
                                                                                        console.log("Error in setting status of submission: ", err);
                                                                                    });

                                                                                }).catch(function(err) {
                                                                                    console.log("Error in setting cost of submission: ", err);
                                                                                });
                                                                            }).catch(function(err) {
                                                                                console.log("Error in setting rating of submission: ", err);
                                                                            });

                                                                            SATContract.deployed().then(function(SARAinstance) {
                                                                                //console.log(req.user.address, req.user.pwd);
                                                                                web3.personal.unlockAccount(web3.eth.accounts[0], "123456");

                                                                                instance.setCredibility(result2[0].toLowerCase(), creds[0] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[0] - mean))) * 10.0 / 3.0)) < 0 ? 0 : creds[0] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[0] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                instance.setCredibility(result2[1].toLowerCase(), creds[1] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[1] - mean))) * 10.0 / 3.0)) < 0 ? 0 : creds[1] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[1] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                instance.setCredibility(result2[2].toLowerCase(), creds[2] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[2] - mean))) * 10.0 / 3.0)) < 0 ? 0 : creds[2] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[2] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                instance.setCredibility(result2[3].toLowerCase(), creds[3] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[3] - mean))) * 10.0 / 3.0)) < 0 ? 0 : creds[3] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[3] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                instance.setCredibility(result2[4].toLowerCase(), creds[4] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[4] - mean))) * 10.0 / 3.0)) < 0 ? 0 : creds[4] + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[4] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });

                                                                                SARAinstance.transfer(result2[0].toLowerCase(), 10 + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[0] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                SARAinstance.transfer(result2[1].toLowerCase(), 10 + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[1] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                SARAinstance.transfer(result2[2].toLowerCase(), 10 + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[2] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                SARAinstance.transfer(result2[3].toLowerCase(), 10 + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[3] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });
                                                                                SARAinstance.transfer(result2[4].toLowerCase(), 10 + Math.max(-9, parseInt((3 - Math.floor(Math.abs(result3[4] - mean))) * 10.0 / 3.0)), { from: web3.eth.accounts[0], gas: 100000 });

                                                                            }).then(function(result) {
                                                                                console.log("Rewards have been successfully distributed");

                                                                            }).catch(function(err) {
                                                                                console.log("Error in distributing rewards ", err);
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });


                                                    }).catch(function(err) {
                                                        console.log("Error in getting marks: ", err);
                                                    });
                                                }).catch(function(err) {
                                                    console.log("Error in getting reviews: ", err);
                                                });
                                            }
                                        }).catch(function(err) {
                                            console.log("Error in isReviewed function: ", err);
                                        });

                                    }).catch(function(err) {
                                        console.log("Error in giving Marks ", err);
                                    });
                                }).catch(function(err) {
                                    console.log("Error in Reviewing submission: ", err);
                                });

                            }).catch(function(error) {
                                console.log("Error in deploying MainContract: ", err);
                            });
                        } else {
                            console.log("Error in insertion of Review in database", err);
                        }
                    });
                }
            });

            res.redirect("/u");
        });

    return yesnoRouter;
}
module.exports = u_router;