var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/test');

function validator(v) {
  return v.length > 0;
}

var User = new mongoose.Schema({
  name   : { type: String, validate: [validator, "Empty Error"] }
  , created: { type: Date, default: Date.now }
  , posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

module.exports = mongoose.model('User', User);