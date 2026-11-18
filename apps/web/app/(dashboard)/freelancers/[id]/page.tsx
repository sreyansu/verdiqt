import { redirect } from "next/navigation";

export default async function FreelancerPublicProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/profile/${resolvedParams.id}`);
}

