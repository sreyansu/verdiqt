import { redirect } from "next/navigation";

export default async function ContractMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  redirect(`/messages?contractId=${resolvedParams.id}`);
}

