import { z } from "zod";

const isoDatetime = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid datetime string" }
);

const createContractSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  totalAmount: z.number().positive(),
  currency: z.string().default("INR"),
  startDate: isoDatetime,
  endDate: isoDatetime,
  freelancerEmail: z.string().email(),
  milestones: z
    .array(
      z.object({
        title: z.string().min(3),
        description: z.string().min(5),
        amount: z.number().positive(),
        dueDate: isoDatetime,
      })
    )
    .min(1),
});

const payload = {
  title: "E-commerce Website Redesign",
  description: "Complete UI redesign of the main e-commerce platform including homepage, product pages, and checkout flow.",
  totalAmount: 35000,
  freelancerEmail: "freelancer@verdiqt.app",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  milestones: [
    {
      title: "Wireframes & UX",
      description: "Initial wireframes and user flow mapping.",
      amount: 15000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Final Design Handoff",
      description: "Delivery of final high-fidelity Figma components.",
      amount: 20000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

try {
  createContractSchema.parse(payload);
  console.log("Validation passed");
} catch (e: any) {
  console.log(JSON.stringify(e.errors, null, 2));
}
