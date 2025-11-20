import {useEffect} from "react";
import {createPortal} from "react-dom";
import {useQuickView} from "~/providers/QuickViewProvider";
import {useFetcher} from 'react-router';
import QuickViewContent from "~/components/QuickViewContent";

export default function QuickViewDialog() {
  const {isOpen, close, handle} = useQuickView();
  const fetcher = useFetcher();

  // Load the product data when the dialog is opened to create the quick view
  useEffect(() => {
    if (isOpen && handle) {
      fetcher.load(`/quick-view/${handle}`);
    }
  }, [isOpen, handle]);

  const product = fetcher.data?.product;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={close} />

      <div className="relative bg-white w-full max-w-md p-4 rounded-xl shadow-xl z-10">

      <button
        onClick={close}
        className="
          absolute top-1 right-1
          z-50
          w-8 h-8
          flex items-center justify-center
          rounded-full
          bg-white shadow-md
          border border-gray-300
          hover:bg-gray-100 active:bg-gray-200
          transition
        "
        aria-label="Close"
      >
        <span className="text-gray-700 text-lg font-bold leading-none">×</span>
      </button>


        {fetcher.state === "loading" && <p>Loading…</p>}

        {product && <QuickViewContent product={product} />}

        {!product && fetcher.state === "idle" && <p>No product found.</p>}
      </div>
    </div>,
    document.body
  );
}
