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
    currentKey: string;
    inArray: boolean;
    arrayStack: any[];
}

const state: State = {
    "currentKey": "",
    "inArray": false,
    "arrayStack": [],
};




parser.onopenobject = function (key: string) {

    state["currentKey"] = key;

    let arrItem = {key: state["currentKey"]}
    state["arrayStack"].push(arrItem);

}

parser.oncloseobject = function () {

    state["arrayStack"].pop();

    const arr = state["arrayStack"].pop();
    if (arr) {
        arr.index += 1;
        arr.arrayOfValue = false;
        state["arrayStack"].push(arr);
    }

    
}

parser.onkey = function (key: string) {
    state["currentKey"] = key;

    state["arrayStack"].pop();

    state["arrayStack"].push({key: state["currentKey"]});

}

parser.onopenarray = function () {

    // If array detected update the previous item on the stack
    let arr = state["arrayStack"].pop();

    arr.inArray = true;
    arr.index = 0;
    arr.arrayOfValue = true;

    state["arrayStack"].push(arr);

}

parser.onclosearray = function () {

}

parser.onvalue = function (value: any) {

    console.log(value);

    // If array detected update the previous item on the stack
    let arr = state["arrayStack"].pop();
    
    
    if (arr) {
        arr.value = value;

        if (arr.arrayOfValue) {
            arr.index = -1;
            arr.arrayOfValue = false;
        }

        if (arr.inArray) {
            arr.index += 1;
        }
        state["arrayStack"].push(arr);
    }


    console.log(state["arrayStack"]);

    // build path
    let path = "";
    for (const item of state["arrayStack"]) {
        path += "."+item.key;

        if (item.inArray) {
            path += ".[" + item.index + "]";
        } 
    }

    console.log(path);

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
