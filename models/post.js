var mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost/test');

function validator(v) {
  return v.length > 0;
}

var Post = new mongoose.Schema({
  text   : { type: String, validate: [validator, "Empty Error"] }
  , created: { type: Date, default: Date.now }
  , user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Post', Post);