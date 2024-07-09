import { z } from 'zod';

type Vendor = {
    _id: string;
    name: string;
};

const vendorInputSchema = z.object({
    _id: z.string(),
    name: z.string(),
});

type VendorInput = z.infer<typeof vendorInputSchema>;

export { Vendor, VendorInput, vendorInputSchema };
