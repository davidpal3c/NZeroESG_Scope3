export default function TemporaryBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-blue-900 p-3 text-center text-white">
      <p className="text-sm">
        Active rebuild: the assistant is optional while the traceable data
        workflow is under construction.
      </p>
    </div>
  );
}
