const fs = require('fs');
const { model } = require('mongoose');

/*
here , i have encountered one problem over here , whenever i override the image file
with the new one the older one sticks over there. so , i want to delete whenever overrides
happens.

 this function i am going to use to delete the image file.
 unlinke will delete the image*/

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if(err){
            throw (err);
        }
    });
};

exports.deleteFile = deleteFile;