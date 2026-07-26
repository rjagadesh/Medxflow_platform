import React from "react";

export const BillingHeader = () => {
  return (
    <header className="h-16 border-b border-border-dark bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Billing Overview
        </h2>
        <div className="h-4 w-[1px] bg-border-dark mx-2"></div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[var(--chakra-colors-primary-400)]] transition-colors text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search invoices..."
            className="bg-card-dark border border-border-dark rounded-lg pl-10 pr-4 py-1.5 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-primary focus:border-primary w-64 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <a
            href="#"
            className="hover:text-[var(--chakra-colors-primary-400)]] transition-colors"
          >
            Usage
          </a>
          <a
            href="#"
            className="hover:text-[var(--chakra-colors-primary-400)]] transition-colors"
          >
            Invoices
          </a>
          <a
            href="#"
            className="hover:text-[var(--chakra-colors-primary-400)]] transition-colors"
          >
            Payments
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-black"></span>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="h-8 w-[1px] bg-border-dark"></div>
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none text-white">
                Kabilan B
              </p>
              <p className="text-[10px] text-gray-500 mt-1">Admin</p>
            </div>
            <div className="size-9 rounded-full border-2 border-primary/20 p-0.5 cursor-pointer hover:border-primary/50 transition-colors">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4fcsjj39w-W93CKIICoTX7xDYTvRwaJf58qzIWuvwKh6fHC5Xx2BOw3rYN2vqN_o9u4w6dpq2xorl874bd5WNhBKvsgUCFmPWY1q3j1D-8rvxhkxLL8X5reC_m-rq5HvAWfxfvISVGmdyZsW36PwgNki8fIgvFmu4OZ7I1QJCjgEMCAZ8BLbuvYVnYzTDBHbaWJG85b9OUu4gyisgG8hYx_KG3aEaIf8EvJNvxqoxhk_OZkrVQHTcqvLlpg9sPAuDBGHkT1fBQhBW"
                alt="Profile"
                className="rounded-full size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
