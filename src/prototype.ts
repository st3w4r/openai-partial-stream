import { z } from "zod";

const PostCodeSchema = z.object({
    postcode: z.string(),
    councilName: z.string(),
});


const postCode = {
    postcode: "E1 6AN",
    // councilName: "Tower Hamlets",
    country: "UK",
};

const res = PostCodeSchema.safeParse(postCode);

console.log(res.success);
console.log(res.success ? res.data : res.error);
