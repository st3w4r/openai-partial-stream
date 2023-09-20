import clarinet from "clarinet";
import fs, { stat } from "fs";
import { parseJsonSourceFileConfigFileContent } from "typescript";



function randomlySplit(str: string, numPieces: any) {
    // If the desired number of pieces is 1 or less, return the string in an array
    if (numPieces <= 1) return [str];

    let splitIndexes: any[] = [];
    for (let i = 0; i < numPieces - 1; i++) {
        // Generate a random index between 1 and str.length - 1
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * (str.length - 1)) + 1;
        } while (splitIndexes.includes(randomIndex));
        splitIndexes.push(randomIndex);
    }

    // Sort the indexes to split the string sequentially
    splitIndexes.sort((a, b) => a - b);

    let lastSplit = 0;
    let result = [];
    for (let i = 0; i < splitIndexes.length; i++) {
        result.push(str.substring(lastSplit, splitIndexes[i]));
        lastSplit = splitIndexes[i];
    }
    result.push(str.substring(lastSplit));

    return result;
}



// Read from file
const filename = "./spec/data/color_1_fc_arguments.json";
const content = fs.readFileSync(filename, "utf8");

// Random split over te text
const tokens = randomlySplit(content, 150);

console.log(tokens);


const parser = clarinet.parser();

// JSON parser
type State = {
    object: number;
    array: number;
    path: string[];
    arrayIndex: number;
    currentKey: string;
    inArray: boolean;
    arrayStack: any[];
}

const state: State = {
    "object": 0,
    "array": 0,
    "path": [],
    "arrayIndex": 0,
    "currentKey": "",
    "inArray": false,
    "arrayStack": [],
};




parser.onopenobject = function (key: string) {

    // state["path"].push(key);

    
    state["currentKey"] = key;
    
    if (state["arrayStack"].length > 0) {
        let arrayIdx = state["arrayIndex"];
        state["path"].push("["+arrayIdx+"]");
        
        // if (state["inArray"]===true) {
            
            // TODO increment only on same level array
            state["arrayIndex"] += 1;
            // }
    }

    // let arrItem = {index: state["arrayIndex"]}
    // state["arrayStack"].push(arrItem);

}

parser.oncloseobject = function () {

    if (state["arrayStack"].length > 0) {
        state["path"].pop();
    }
    
}

parser.onkey = function (key: string) {
    // console.log("object", key);

    state["currentKey"] = key;

}

parser.onopenarray = function () {

    state["path"].push(state["currentKey"]);

    // state["inArray"] = true;

    
    // Push array to stack, reset index
    let arrItem = {index: state["arrayIndex"]}
    state["arrayStack"].push(arrItem);
    state["arrayIndex"] = 0;

    console.log(state["arrayStack"]);

}

parser.onclosearray = function () {

    state["path"].pop();

    // state["inArray"] = false;
    state["arrayStack"].pop();

    let currentStack = state["arrayStack"][state["arrayStack"].length-1];

    if (currentStack) {
        state["arrayIndex"] = currentStack.index;
    } else {
        state["arrayIndex"] = 0;
    }

    // state["arrayStack"]
    // state["arrayIndex"] = currentStack.index;

    // console.log("CLOSE ARR:", state["arrayStack"][state["arrayStack"].length-1]);
    
    // state["arrayIndex"] = state["arrayStack"][state["arrayStack"].length-1].index;
    // state["arrayStack"] = state["arrayStack"].pop()

    console.log(state["arrayIndex"]);
    console.log(state["arrayStack"]);

}

parser.onvalue = function (value: any) {

    state["path"].push(state["currentKey"]);
    
    console.log(state["path"].join("."));
    
    state["path"].pop();

}

parser.onend = function () {
    console.log("end");
}


tokens.forEach((token: string) => {
    parser.write(token);

    // console.log(state);
});









// parser.onopenobject = function (key: string) {
//     state["object"] += 1;
//     // console.log("object", key);

//     if (state["array"] > 0) {
//         state["path"].push("["+state["arrayIndex"]+"]");
//     } 


//     console.log(state["path"].join("."));
//     // else {
//     //     state["path"].push(key);
//     // }

// }

// parser.oncloseobject = function () {

//     state["object"] -= 1;
//     // state["path"].pop();

//     if (state["array"] > 0) {
//         state["arrayIndex"] += 1;
//     }

//     console.log(state["path"].join("."));

// }

// parser.onkey = function (key: string) {
//     state["path"].pop();
//     // console.log("key", key);

//     // if (state["array"] > 0) {
//     //     state["path"].push("["+state["arrayIndex"]+"]");
//     // }

//     state["path"].push(key);
//     console.log(key)

//     console.log(state["path"].join("."));

// }

// parser.onopenarray = function () {
//     state["arrayIndex"] = 0;
//     state["array"] += 1;

//     // let arrayIdx = state["arrayIndex"];
//     // state["path"].push("["+arrayIdx+"]");

//     console.log(state["path"].join("."));

// }

// parser.onclosearray = function () {
//     state["array"] -= 1;
//     // state["path"].pop();

//     console.log(state["path"].join("."));

// }

// parser.onvalue = function (value: any) {
//     const path = state["path"].join(".");
//     // console.log(path);

//     // console.log("PATH:",path, "VALUE:", value);
//     // console.log(path, "value", value);
    
    
//     // state["path"].pop();
//     // console.log(path);

//     console.log(state["path"].join("."));

// }

// parser.onend = function () {
//     console.log("end");

//     console.log(state["path"].join("."));

// }


// tokens.forEach((token: string) => {
//     parser.write(token);

//     // console.log(state);
// });








// ON OPEN OJECT -> Object +1
// ON CLOSE OBJECT -> Object -1
// ON KEY -> add key to path
//      if in array -> add array index to path
// ON OPEN ARRAY -> Array +1
//      Reset array index
// ON CLOSE ARRAY -> Array -1
// ON VALUE -> pop path
