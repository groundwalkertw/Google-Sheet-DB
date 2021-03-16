//Every SpreadSheet DB is associated with one Google spreadsheet, and therefore an ID for a spreadsheet file.
//Each DB can have multiple models.
//Each model is associated with a sheet, and a schema.
//But we can apply multiple a schema on different models.


class SheetDB{
    Schema: Schema;
    spreadsheetId: string;
    spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

    constructor(id){
        this.spreadsheetId = id;
        this.spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);

        //the function modelCreator is defined below.
        this.model = modelCreator.bind(this); 

    }
}


SheetDB.Schema = class Schema{
    name: string;
    attributes: object;
    indexArray: string[];
    jsonId: string | null;

    constructor( schema, name ){
        this.name = name;
        this.attributes = { _id: { _index: 0, _type: 'number'} };
        this.indexArray = ['_id'];

        const indexAssociate = indexAssociateCreate(1, this);

        indexAssociate.call( this.attributes, schema, '');      
    }   

    saveJSON (folderId) {
        let json=JSON.stringify(this);
        this.jsonId = folderId? DriveApp.getFolderById(folderId).createFile(this.name,json,'application/json').getId() :
        DriveApp.createFile(this.name, json, 'application/json').getId();        
    }

    static loadJSONById (fileId){
        let obj = Object.create(this.prototype);
        let objJSON = JSON.parse( DriveApp.getFileById(fileId).getBlob().getDataAsString() );
        Object.assign(obj,objJSON);

        obj.jsonId = fileId;
        return obj;
    }
    static loadJSONByName(name, folderId){
        let obj = Object.create(this.prototype);
        let file = folderId? DriveApp.getFolderById(folderId).getFilesByName(name).next() : DriveApp.getFilesByName(name).next();
        let objJSON = JSON.parse( file.getBlob().getDataAsString() ); 
        
        Object.assign(obj,objJSON);

        obj.jsonId = file.getId();
        return obj;
    }

    static load (schemaObj){
        let obj = Object.create(this.prototype);
        Object.assign(obj,schemaObj);
        return obj;
    }
    updateJSON(){
        if(!this.jsonId) throw new ReferenceError(`The JSON file hasn't be created yet.`);
        let file = DriveApp.getFileById(this.jsonId);
        file.setContent( JSON.stringify(this) );
    }
    /*
    addNewEntries(schemaAddOn){
        const indexFrom = this.indexArray.length;
        const indexAssociate = indexAssociateCreate(indexFrom, this);
        indexAssociate.call(this.attributes, schemaAddOn, '');
    }
    propSwap(propA, propB){
        const proA = this.attributes.subPropertyFinder(propA);
        const proB = this.attributes.subPropertyFinder(propB);
        if(proA === undefined || proB === undefined) throw new ReferenceError(`The propert(ies) don't exist`);

        let tmp = proA._index;
        proA._index = proB._index;
        proB._index = tmp;

        this.indexArray[proA._index] = propA;
        this.indexArray[proB._index] = propB;
    }
    */

}

function modelCreator(modelName, schemaObj){
    let modelClass =  class theModelClass{
        _values: any[];
    //The constructor here is to create an instance of the model.
    //We can think of the class itself, but not the constructor, as the model.
        constructor(inputObj){
            this._values = [];
            const valueArray = this._values;
            createInstance.call(this, schemaObj.attributes, inputObj);

            function createInstance(currentSchema, currentInputObj){
                for( let prop in currentSchema ){
                    if(prop === '_type') continue;

                    let currentIndex = currentSchema[prop]._index;

                    if( currentSchema[prop]._type === 'object' ){
                        this[prop] = {};
                        createInstance.call( this[prop], currentSchema[prop], optChaining(currentInputObj, prop) );
                    }
                    else{
                    /*Object.defineProperty(this, '_' + prop, {
                                value: null,
                                enumerable: false,
                                writable: true,
                            }
                        );*/

                        this[prop] = {};

                        /*this[prop].getValue = function(){ return thisObj[currentIndex]; };
                        this[prop].setValue = function(value){
                            const type = currentSchema[prop]._type;
                            const trueFlag = type === 'Date'? value instanceof Date : typeof value === type;

                            if(!trueFlag) throw new TypeError(`The input ${prop} is of an incorrect type.`);
                            thisObj[currentIndex] = value;
                        };*/
                        
                        Object.defineProperty(this, prop,{
                            enumerable: true,
                            set: function(value){
                                const type = currentSchema[prop]._type;
                                let trueFlag = type === 'Date'? value instanceof Date : typeof value === type;

                                if(!trueFlag) throw new TypeError(`The input ${prop} is of an incorrect type.`);
                                valueArray[currentIndex] = value;
                            },
                            get: function(){ return valueArray[currentIndex]; }
                           }
                        );
                        
                        if( optChaining(currentInputObj, prop) === undefined ) valueArray[currentIndex] = null;
                        else this[prop] = currentInputObj[prop];                           
                    }
                }
            }            
      }

               //static sheet = sheetDB.spreadsheet.getSheetByName(modelName);
        static maxRow(){
            this.sheetChecker();
            return this.sheet.getLastRow();
        }

        static indexFromProp( prop ) {
            const theIndex = optChaining(schemaObj.attributes.subPropertyFinder(prop), '_index');
            if(theIndex === undefined) throw new Error(`The property name ${prop} doesn't exist.`); 
            return theIndex + 1;        
        }
        
        static sheetChecker(){
            if (!this.sheet) throw new ReferenceError(`The model hasn't been created on the spreadsheet.`);
        }

        save(){
            theModelClass.sheetChecker();

            if(this._id === null){
                this._currentRow = theModelClass.maxRow()+1;
                this._id = theModelClass.maxRow()===1? 0: modelClass.sheet.getRange( theModelClass.maxRow(), 1 ).getValue() + 1; 
            }
          
            const range = modelClass.sheet.getRange( this._currentRow, 1, 1, theModelClass.entriesNum );

            range.setValues([this._values]);        
        }

/*        updateEntries(...properties){
            theModelClass.sheetChecker();

            let rowNow = theModelClass.maxRow();

            if(this._id === null){
                this._id = theModelClass.newId();
                theModelClass.sheet.getRange(++rowNow, 1).setValue(this._id);
            }
             
            for(let propStr of properties){
                const range = theModelClass.sheet.getRange(rowNow, theModelClass.indexFromPropString(propStr) );
                range.setValue(this.subPropertyFinder(propStr));
            }
        }
*/
        static findById(id) {
            return this.findByRow( this.findRowById(id) );
        }
        static findRowById(id){
            const idsRange = this.sheet.getRange(2, 1 , Math.max(this.maxRow()-1, id) , 1);
            const idRange = idsRange.createTextFinder(id).findNext();
            if ( !idRange ) throw new Error(`This ID doesn't exist`);            
            return idRange.getRow();
        }
        static findByRow(row){
            const dataArray = ( this.sheet.getRange(row, 1, 1, this.entriesNum).getValues() )[0];
            let instance = new theModelClass();

            Object.assign(instance._values,dataArray);
            instance._currentRow = row;

            return instance;
        }

        static findByPropValue(propString, value){
            let index = schemaObj.attributes.subPropertyFinder(propString)._index;
            if(index === undefined) throw new Error(`This property doesn't exist.`);

            const propRange = this.sheet.getRange(2, index + 1, this.maxRow() -1, 1);
            const propFinder = propRange.createTextFinder(value);

                    //Note: textFinder isn't an iterator!

            let rowSet = new Set();
            for(let result of propFinder.findAll()){
                rowSet.add(result.getRow());
            }
           /* while(true){
                result = propFinder.findNext();
                if(!result) break;

                rowSet.add(result.getRow());
            }*/
            return rowSet;
        }
        
        static findByValue(value){
            const range = this.sheet.getRange(2, 2, this.maxRow() -1, this.entriesNum - 1);
            const finder = range.createTextFinder(value);
            
            let rowSet = new Set();
            for(let result of finder.findAll()){
                rowSet.add(result.getRow());
            }
            /*while(true){
                result = finder.findNext();
                if(!result) break;

                rowSet.add(result.getRow());
            }*/
            return rowSet;
        }

        static rowSetToInstances(rowSet){
            let array = [];
            for(let row of rowSet){
                array.push(this.findByRow(row));
            }
            return array;
        }
        static search(value, prop){
            const rowSet = prop? this.findByPropValue(prop, value) : this.findByValue(value);    
            return this.rowSetToInstances(rowSet);
        }
        static searchAndReturnPropVal(value, propReturn, prop){
            const rowSet = prop? this.findByPropValue(prop, value) : this.findByValue(value);
            const dataArray = this.getColArrayByProp(propReturn);
            let array = [];
            for(let i of rowSet){
                array.push(dataArray[i - 2]);
            }
            return array;
        }
        static searchAndReturnRawObjs(value, props, prop){
            const instances = this.search(value, prop);
            return instances.map( x => {
                let y = {};
                for(let p of props){
                    y[p] = x.subPropertyFinder(p);
                }
                return y;
            });
        }

        static createModel(){
            if( this.sheet ) throw new Error(`This model has been created!`);
            else this.sheet = modelClass.spreadsheet.insertSheet(modelName);
            
            const range = this.sheet.getRange( 1, 1, 1, this.entriesNum);
            range.setValues( [schemaObj.indexArray] );
        }
        static updateModel(){
            if( !this.sheet ) throw new Error(`This model hasn't been created!`);
            const range = this.sheet.getRange( 1,1,1,this.entriesNum);
            range.setValues( [schemaObj.indexArray] );
        }

        static deleteInstanceById(id) {
            this.sheet.deleteRow( this.findRowById(id) );
        }

        static getColArrayByProp(prop){
            return this.sheet.getRange( 2, this.indexFromProp(prop), this.maxRow() - 1, 1 ).getValues().map( x=> x[0] );
        }
        static getColArraysByProps(...props){
            return props.map( prop => this.getColArrayByProp(prop) ); 
        }
        static getPropsOfInstances(...props){
            const arrays = this.getColArraysByProps(...props);
            let array = [];
            let inst = {};
            for(let i in arrays[0]){
                inst = {};
                for(let j in props){
                    inst[ props[j] ] = arrays[j][i];
                }
                array.push(inst);                    
            }
            return array;                        
        }
        /*static propTranspose(propA, propB){
            
        }*/
        static operateByProps(func, ...props){
            const colArrays = this.getColArraysByProps(...props);       
            return operateOnVecs(func, ...colArrays);
        }
        static saveAProperty(prop, colArray){
            this.sheet.getRange(2, this.indexFromProp(prop), colArray.length, 1).setValues( colArray.map( x => [x] ) );          
        }
        static saveProperties(...args){
            if(args.length % 2) throw new Error(`The number of arguments is incorrect.`);
            for(let i = 0; i < args.length/2; i++){
                this.saveAProperty( args[i], args[i + args.length/2] );
            }            
        }

        static pickIdsByPropAndSort(prop, critFunc = ( () => true ), compFunc = function(a, b){
            if(a > b) return 1;
            else if(a < b) return -1;
            else return 0;            
        } ){
            const idAndProVec = this.getColArraysByProps('_id', prop);
            let vecTr = [];
            for(let i = 0; i < idAndProVec[0].length; i++){
                vecTr.push( [ idAndProVec[0][i], idAndProVec[1][i] ] );
            }
            let vec = vecTr.filter( x => critFunc( x[1] ) );
            vec.sort( (x, y) => compFunc( x[1], y[1] ) );

            Logger.log(vec);
            //return vecTr.map( x => x[0] );
        }
                       
    };

            //static properties
    modelClass.spreadsheet = this.spreadsheet;
    modelClass.sheet = this.spreadsheet.getSheetByName(modelName);
    modelClass.entriesNum = schemaObj.indexArray.length; 
    modelClass.schema = schemaObj;

    return modelClass;  
}

