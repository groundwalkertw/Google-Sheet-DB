Object.defineProperty( Object.prototype, 'subPropertyFinder', {
    value: function(propString: string){
      const propArray = propString.split('.');

      //as the optional chaining can't be used, I have to use the conditional operator.
      return propArray.reduce( (accum, current) => optChaining(accum, current), this );
      },
    enumerable: false,
  } 
);

function operateOnVecs<T>(func: (...a: any[]) => T, ...vecs: any[]): T[]{
    const len = vecs[0].length;
    if (!vecs.every( x => x.length === len ) ) throw new RangeError(`The lengths of the arrays aren't equal.`);

    let result: T[] = [];
    for(let i = 0; i < len; i++){
        result.push( func( ...vecs.map( vec => vec[i] ) ) );
    }
    return result;
}

//The optional chaining can't be used on GAS.
function optChaining(obj, prop){
  return obj? obj[prop] : obj;
}

//Define this function creator to use closure
function indexAssociateCreate(indexFrom: number, theObj: Schema){
    let index = indexFrom;

    return function indexAssociate(obj, attributeString){
    for(let prop in obj){
        let currentString = `${attributeString}.${prop}`;
        if( !obj[prop] ) throw new RangeError('You need to indicate the types of the properties!'); 

        if( typeof obj[prop] === 'object' ){
            if(!this[prop]){
                this[prop] = {};
                this[prop]._type = 'object';
            }
            
            indexAssociate.call( this[prop], obj[prop], currentString);
        }
        else{
            if(this[prop]) throw new ReferenceError(`This property already exists.`);
            this[prop]={};
            this[prop]._index = index;
            this[prop]._type = obj[prop];
            theObj.indexArray[index++] = currentString.substring(1);
        }
    }
}
}
