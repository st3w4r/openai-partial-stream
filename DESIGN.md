# Design


Features it need to support:
- Delimitter/separator
- Pattern
- List
- Object key
- JSON



Stream parser:
- Receice token in stream
- Buffer the token until the element can be parsed
- Return the parsed element
- Clear the buffer


LLM:
- Pass to the LLM the expected structure to return.



Validation library:
- Zod



Features:
- Object
- List
- Item
- Object key
- Object Keyed String Value    (stream individual characters)
- Object Keyed Number Value    (stream left to right)
- Object Keyed Boolean Value   (steram first letter T/F)
- Object Keyed Null Value      (stream first letter N)

Index of object


# Partial stream parser Object key

- In a list of object
- Stream each key/value of the object when available

- Detect the start of an object "{"
- Detect the end of an object "}"
- If in inString
- Accumulate until the end of the key/value
- Pattern: "key": "value"
- At the last " of the value, return the key/value
- Check if the key is part of the schema
- Check if the value is valid for the key in the schema
- If not valid, return nothing and continue
- When the end of the object is detected, return the object
-



## Stream parser Design new algorithm:



Token              ->    Type
[                  ->    array 0
{"post             ->    obj 0 key 0
code": "SW         ->    key 0 value 0
1A                 ->    value 0
1AA", "co          ->    value 0 key1
unc                ->    key1
ilName"            ->    key1
: "                ->    value1
City of Westmin    ->    value1
ster               ->    value1
"},                ->    value 1
{"post             ->    obj 1 key 1



Count number of open and close brackets

If open bracket `{` add to the hash map with the key object: +1

If close bracket `}` add to the hash map with the key object: -1

If open bracket `[` add to the hash map with the key array: +1

If close bracket `]` add to the hash map with the key array: -1

If the char `"` is detected add to the hashmap
quote +1


Each time it close, it adds to the general counter
Object +1
or Array +1
The genral counter will be used as index.


If the char `"` is detected and the backet `{` is > 0  then it is a key
Add + 1 to the key counter in the hashmap

if the char `"` is detected and the backet `{` is > 0  and the key counter is > 0 then it the end of the key.
Reduce the key counter by 1 in the hashmap


If the char `"` is detected and the backet `{` is > 0  then it is a value and key counter is even.
Add + 1 to the value counter in the hashmap


If the char `"` is detected and the backet `{` is > 0  and the key counter is even
and the value counter is > 0 then it the end of the value.


Manual step by step:

L1:
{
 "array": 1,
}

L2:
{
 "array": 1,
 "object": 1,
 "quote": 1,
}

L3:
{
 "array": 1,
 "object": 1,
 "quote": 3,
}

L4:
{
 "array": 1,
 "object": 1,
 "quote": 3,
}

L5:
{
    "array": 1,
    "object": 1,
    "quote": 5,
}

L6:
{
    "array": 1,
    "object": 1,
    "quote": 5,
}

L7:
{
    "array": 1,
    "object": 1,
    "quote": 6,
}

L8:
{
    "array": 1,
    "object": 1,
    "quote": 7,
}


L9:
{
    "array": 1,
    "object": 1,
    "quote": 7,
}

L10:
{
    "array": 1,
    "object": 1,
    "quote": 7,
}

L11:
{
    "array": 1,
    "object": 0,
    "quote": 8,
}




Lexer

L1:
{
    "name": "OPEN_ARRAY"
}

L2:
{
    "name": "OPEN_OBJECT"
}
{
    "name": "OPEN_KEY"
}
{
    "name": "KEY",
    "value": "post",
}

L3:
{
    "name": "KEY",
    "value": "code",
}
{
    "name": "CLOSE_KEY"
}
{
    "name": "OPEN_VALUE"
}
{
    "name": "VALUE",
    "value": "SW",
}

L4:
{
    "name": "VALUE",
    "value": "1A",
}
L5:
{
    "name": "VALUE",
    "value": "1AA",
}
{
    "name": "CLOSE_VALUE"
}



The lexer will return the token and the type of token.
The parser will receive the token and the type of token and will return the parsed element.


asdf``
`asd

a`
``


{{
{asd
as}
}}


The interface of the parser will be:

```

const parser = new StreamParser(schema, mode);


parser.on('data', (data) => {
    console.log(data);
});

parser.on('error', (error) => {
    console.log(error);
});

parser.on('end', () => {
    console.log('end');
});


for (const token of stream) {
    parser.write(token);
}

```




Nested object:

STACK TOKEN:        PARENT PATH          EXAMPLE PARENT       KEY/INDEX
- OPEN_OBJECT   ->  ROOT                 ->                   root
- OPEN_KEY      ->  ROOT                 ->                   root
- CLOSE_KEY     ->  ROOT                 ->                   root
- OPEN_ARRAY    ->  ROOT.KEY             -> root              colors
- OPEN_OBJECT   ->  ROOT.KEY.[0]         -> root.colors       0
- OPEN_KEY      ->  ROOT.KEY.[0]         -> root.colors       0
- CLOSE_KEY     ->  ROOT.KEY.[0]         -> root.colors       0
- OPEN_VALUE    ->  ROOT.KEY.[0].KEY0    -> root.colors[0]    hex
- CLOSE_VALUE   ->  ROOT.KEY.[0].KEY0    -> root.colors[0]    hex
- OPEN_KEY      ->  ROOT.KEY.[0]         -> root.colors       0
- CLOSE_KEY     ->  ROOT.KEY.[0]         -> root.colors       0
- OPEN_VALUE    ->  ROOT.KEY.[0].KEY1    -> root.colors[0]    name
- CLOSE_VALUE   ->  ROOT.KEY.[0].KEY1    -> root.colors[0]    name
- OPEN_KEY      ->  ROOT.KEY.[0]         -> root.colors       0
- CLOSE_KEY     ->  ROOT.KEY.[0]         -> root.colors       0
- OPEN_VALUE    ->  ROOT.KEY.[0].KEY2    -> root.colors[0]    description
- CLOSE_VALUE   ->  ROOT.KEY.[0].KEY2    -> root.colors[0]    description
- CLOSE_OBJECT  ->  ROOT.KEY.[0]         -> root.colors       0
- CLOSE_ARRAY   ->  ROOT.KEY             -> root              colors
- CLOSE_OBJECT  ->  ROOT                 ->                   root


```json
{
    "message": {
        "index":4,
        "status":"COMPLETED",
        "data":{
            "hex":"#2EC4B6",
            "name":"Harpooned Blue",
            "description":"A stark but calming, reliable favorite for both modern and traditional designs."
        }
    }
}


{
    "message": {
        "path": "colors.[4]",
        "status":"COMPLETED",
        "data":{
            "hex":"#2EC4B6",
            "name":"Harpooned Blue",
            "description":"A stark but calming, reliable favorite for both modern and traditional designs."
        }
    }
}


{
    "message":{
        "path": "colors",
        "index":4,
        "status":"PARTIAL",
        "data":{
            "hex":"#2EC4B6",
            "name":"Harpooned Blue",
            "description":"A stark but calming, reliable favorite for both modern and traditional designs."
        }
    }
}


{
    "message":{
        "status":"PARTIAL",
        "path": "colors",
        "index":4,
        "key" "hex",
        "value": "#2EC4B6",
    }
}
{
    "message":{
        "status":"PARTIAL",
        "path": "colors",
        "index":4,
        "key" "name",
        "value": "Harpooned Blue",
    }
}
{
    "message":{
        "status":"PARTIAL",
        "path": "colors",
        "index":4,
        "key" "description",
        "value": "A stark but calming, reliable",
    }
}


        "data":{
            "hex":"#2EC4B6",
            "name":"Harpooned Blue",
            "description":"A stark but calming, reliable favorite for both modern and traditional designs."
        }

```


```json
{
"message":{
    "status":"PARTIAL",
    "path": "colors.[0]",
    "value": "#FF6633",
}
}

{
"message":{
    "status":"PARTIAL",
    "path": "colors.[0]",
    "tpye": "array",
    "key": null,
    "value": "#FF6633",
}
}



{
"message":{
    "status":"PARTIAL",
    "path": "colors.[0]",
    "type": "object",
    "key": "hex",
    "value": "#FF6633",
}
}


{
"message":{
    "status":"PARTIAL",
    "path": "colors.[4].name",
    "value": "#FF6633",
}
}


{
"message":{
    "status":"PARTIAL",
    "path": ["colors",4,"name"],
    "value": "#FF6633",
}
}
{
"message":{
    "status":"PARTIAL",
    "path": ["colors",3,"name"],
    "value": "#FF2244",
}
}

{
"message":{
    "status":"PARTIAL",
    "path": ["colors", 1],
    "data": {
        "hex": "#FF2244",
    },
}
}






```
