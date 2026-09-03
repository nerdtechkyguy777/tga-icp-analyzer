import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-tga-orange-500 bg-tga-teal-800 text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
          <Image
            src="/tga-logo.png"
            alt="The Global Associates"
            width={140}
            height={36}
            className="h-8 w-auto"
          />
        </div>
        <p className="text-sm text-white/60 text-center">
          Delivering Sales &amp; Marketing Solutions Globally
        </p>
        <p className="text-xs text-white/50 text-center sm:text-right">
          Designed &amp; Developed By Mohammad Aquib
        </p>
      </div>
    </footer>
  );
}
