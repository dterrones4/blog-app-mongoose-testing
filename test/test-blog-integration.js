'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
    console.info('seeding blog data');
    const seedData = [];

    for(let i = 1; i <= 10; i++){
        seedData.push({
            author: {
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName()
            },
            title: faker.lorem.words(),
            content: faker.lorem.sentences()
        });
    }
    return BlogPost.insertMany(seedData);
};

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('blogs API resource', function () {

    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function() {
        return seedBlogData();
    });

    afterEach(function() {
        return tearDownDb();
    });

    after(function() {
        return closeServer();
    });

    describe('GET endpoint', function() {
        it('should return all existing blogs', function() {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function(_res) {
                res = _res
                expect(res).to.have.status(200);
                expect(res.body).to.have.lengthOf.at.least(1);
                return BlogPost.count();
            })
            .then(function(count) {
                expect(res.body).to.have.lengthOf(count);
            });
        });

        it('should return blogs with right field', function (){
            let resBlog;
            return chai.request(app)
                .get('/posts')
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.lengthOf.at.least(1);

                    res.body.forEach(function(post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys(
                            'id', 'title', 'content', 'author', 'created');
                    });
                    resBlog = res.body[0];
                    return BlogPost.findById(resBlog.id);
                })
                .then(function(post) {
                    expect(resBlog.id).to.equal(post.id);
                    expect(resBlog.title).to.equal(post.title);
                    expect(resBlog.content).to.equal(post.content);
                    //expect(resBlog.author.firstName).to.equal(post.author.firstName);
                    //expect(resBlog.created).to.equal(post.created);
                });
        });
    });

    describe('POST endpoint', function() {
        it('should add a new blog post', function () {
            
            const newBlog = {
                author: {
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName()
                },
                title: faker.lorem.words(),
                content: faker.lorem.sentences()
            };
            
            return chai.request(app)
                .post('/posts')
                .send(newBlog)
                .then(function(res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys(
                        'id', 'title', 'content', 'author', 'created');
                    expect(res.body.title).to.equal(newBlog.title);
                    expect(res.body.id).to.not.be.null;
                    expect(res.body.content).to.equal(newBlog.content);
                    //expect(res.body.author).to.equal(newBlog.author);

                    return BlogPost.findById(res.body.id);
                })
                .then(function(post) {
                    expect(post.title).to.equal(newBlog.title);
                    expect(post.content).to.equal(newBlog.content);
                    //expect(post.author.firstName).to.equal(newBlog.author.firstName);
                    //expect(post.author.lastName).to.equal(newBlog.author.lastName);
                });
        });
    });

    describe('PUT endpoint', function() {
        it('should update fields you send over', function() {
            const updateData = {
                title: 'The Magic Title',
                content: 'There once was a man from nantucket...'
            };

            return BlogPost
            findOne()
            .then(function(BlogPost) {
                updateData.id = BlogPost.id;

                return chai.request(app)
                    .put(`/posts/${BlogPost.id}`)
                    .send(updateData);
            })
            .then(function(res) {
                expect(res).to.have.status(204);

                return BlogPost.findById(updateData.id);
            })
            .then(function(restaurant) {
                expect(BlogPost.title).to.equal(updateDate.title);
                expect(BlogPost.content).to.equal(updateData.content);
            });
        });
    });

    describe('DELETE endpoint', function() {
        it('delete a blog post by id', function() {
            let post;

            return BlogPost
            .findOne()
            .then(function(_post) {
                post = _post;
                return chai.request(app).delete(`/posts/${post._id}`);
            })
            .then(function(res){
                expect(res).to.have.status(204);
                return BlogPost.findById(post.id);
            })
            .then(function(_post) {
                expect(_post).to.be.null;
            });
        });
    });
});

