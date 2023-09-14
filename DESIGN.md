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


