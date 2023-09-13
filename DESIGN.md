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
