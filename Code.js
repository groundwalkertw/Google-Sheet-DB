'use strict';

const schema1Name = 'test';
const model1Name = 'testModel';
const model2Name = 'testModel2';
const schema2Name = 'haha';
const idSpreadsheet = '1rlyJSkiqGLfZ5ZGTI9tgpxfXxTC01hXPdEMStEjj9Ds';

function createSchema(){
  let schemaObj = {
    name: 'string',
    age: 'number',
    location: {
      country: 'string',
      zip: 'number',
    }
  };

  let schema = new SheetDB.Schema(schemaObj, theName);

  //schema.addNewEntries({height: 'number', contact : {phone: 'string', email: 'string'}});

  Logger.log(schema);
  schema.saveJSON();

}
function createSchema2(){
    let schemaObj = {
        name: 'string',
        bornyear: 'number', 
    }
    let schema = new SheetDB.Schema(schemaObj, schema2Name);
    schema.saveJSON();
}
function testModel2(){
    const schema1 = SheetDB.Schema.loadJSONByName(schema1Name);
    const schema2 = SheetDB.Schema.loadJSONByName(schema2Name);
    const db = new SheetDB(idSpreadsheet);
    const Model1 = db.model('testModel', schema1);
    const Model2 = db.model('testModel2', schema2);
    //Model2.createModel();

    //Model2.saveProperties('_id','name',...Model1.getColArraysByProps('_id','name'));
    Model2.saveProperties('bornyear',Model1.operateByProps( x => 2020-x, 'age') );
}

function loadSchema(){
  //const schema = sheetDB.Schema.loadJSONByName(theName);
  //schema.updateJSON();

  return SheetDB.Schema.loadJSONByName(schema1Name); 
}

function createInstance(){
  /*Object.defineProperty( Object.prototype, 'subPropertyFinder', {
    value: function(propString){
      const propArray = propString.split('.');

      //as the optional chaining can't be used, I have to use the conditional operator.
      return propArray.reduce( (accum, current) => optChaining(accum, current), this );
      },
    enumerable: false,
  } 
  );*/

  const schema = loadSchema();
  const db = new SheetDB(idSpreadsheet);
  const Model = db.model( 'testModel', schema);
  // ModelClass.createModel();
  //let instance = new ModelClass({name: 'Hai', age: 78, location:{country: 'Japan'}});
  //(new Model({name: 'Hai', age: 78, location:{country: 'Japan'}})).save();
  //(new Model({name: 'Giovanni', age: 47, location:{country: 'Italy'}})).save();

  //instance.name = 'abc';
  //instance.age = 127;
  //Logger.log(instance);

  /*let instance = Model.findById(5);
  instance.location.country = 'US';
  instance.save();*/
  //Logger.log(instance);

  //Model.deleteInstanceById(4);

  /*  const iter = Model.findByPropValue('location.country','En');
    for(let inst of iter){
        Logger.log(inst);
    }
  */  
  //Logger.log(Model.getColArraysByProps('location.country','age'));
  //Logger.log(Model.operateByProps( (x,y)=>x+y,'age','location.zip' ));
  //Model.saveAProperty('age', Model.operateByProps( (x)=>x+1,'age'));

  //Logger.log(Model.pickIdsByPropAndSort( 'age', x=>x>30 ));
  Logger.log(Model.getPropsOfInstances('location.country','age'));
}


