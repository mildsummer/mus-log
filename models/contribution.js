var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/test');

function validator(v) {
  return v.length > 0;
}

var Contribution = new mongoose.Schema({
  text   : { type: String, validate: [validator, "Empty Error"] }
  , created: { type: Date, default: Date.now }
  , user: { type: String, ref: 'User' }
  , url: String
  , base64: String
});

module.exports = mongoose.model('Contribution', Contribution);