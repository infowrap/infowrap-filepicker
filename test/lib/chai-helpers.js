//// Create a chai helper method
//chai.use = function(_chai, utils){
//
////# testing of a model for particular attributes.
////#
////# The first key in the hash must be the index number of the model in the
////# collection. The value of the index are the properties you want
////# to check. Example--- 1: {title:'Root'}
////#
////# @param properties [hash] index#:{key:'value'}
////#
////# @example
////#    collection.should.have.modelAttributes 1: title:'Root'
////#    collection.should.have.modelAttributes
////#        1: title:'Root', next:true
////#        2: title:'child', next:false
//  utils.addMethod(chai.Assertion.prototype, 'modelAttributes', function(properties){
//// Get object from chai
//var collection = utils.flag(this, 'object');
//
//# Check each index
//for(var key in properties){
//
//}
//
//# Iterate over each key:value in each index
//for key of properties[index]
//# make sure that task.at(#) exists
//expect(collection.at(index)).to.exist
//# create a shortcut to atrributes
//attrs = collection.at(index).attributes
//# Then check to see if property exists
//expect(attrs).to.have.property key
//# Finally, see if property has value
//# task at # should have key:val
//expect(attrs).to.have.property key, properties[index][key]
//};