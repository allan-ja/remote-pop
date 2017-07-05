var MongoClient = require('mongodb').MongoClient

var mongodb_url = 'mongodb://localhost:27017/remotepop';

exports.db = function(callback){
  MongoClient.connect(mongodb_url, function(err, database) {
    console.log("Connected correctly to server");
     callback(34);
  });
}
exports.findDocuments = function(db, callback) {
  // Get the documents collection
 db.collection('download').collection.find({}).toArray(function(err, docs) {
    console.log("Found the following records");
    //console.log(docs)
    callback(docs);
  });
}
exports.updateMediaDB = function(db, callback){
    console.log("In updateMediaDB");
    return 34;
}

exports.clearDownloads = function(){
  MongoClient.connect(mongodb_url, function(err, db) {
    console.log("Connected correctly to server");
    db.collection('download').remove({});
    console.log("downloads collection cleared");
  });
}
/*module.exports = {
  'url' :'mongodb://localhost:27017/remotepop',
  updateMediaDB: function(){
      console.log("In updateMediaDB");
      return 34;
  }
}*/
