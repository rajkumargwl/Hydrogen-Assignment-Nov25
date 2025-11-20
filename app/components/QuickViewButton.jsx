import {useQuickView} from '~/providers/QuickViewProvider.jsx';

export default function QuickViewButton({handle}) {
  const {open} = useQuickView();

  return (
    <button
      onClick={() => open(handle)}
      className="sm:px-3 px-2 py-1 sm:py-1 text-xs bg-black text-white rounded"
    >
      Quick View
    </button>
  );
}
