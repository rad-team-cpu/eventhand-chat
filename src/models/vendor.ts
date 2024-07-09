import { z } from 'zod';

type Vendor = {
    _id: string;
    name: string;
};

const vendorInputSchema = z.object({
    _id: z.coerce.string(),
    name: z.coerce.string(),
});

type VendorInput = z.infer<typeof vendorInputSchema>;

export { Vendor, VendorInput, vendorInputSchema };
