import { getStorefront } from "@/app/api/widget.api";
import { BookingWizard } from "@/components/booking/BookingWizard";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;

  let storefront;
  try {
    storefront = await getStorefront(slug);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Business not found";
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Unable to load booking</h1>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <p className="mt-4 text-xs text-gray-400">
          Check the link or contact the cleaning company directly.
        </p>
      </div>
    );
  }

  const { business, services, payment, cancellationPolicy, questions } = storefront;

  if (!services?.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">{business.name}</h1>
        <p className="mt-2 text-sm text-gray-500">
          No services are available for online booking right now.
        </p>
      </div>
    );
  }

  return (
      <BookingWizard
        slug={slug}
        business={business}
        services={services}
        payment={payment}
        cancellationPolicy={cancellationPolicy}
        questions={questions}
      />
  );
}
