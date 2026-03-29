"use client";

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const IndexSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-32 rounded" />
          </div>
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <Skeleton className="h-16 w-3/4 max-w-4xl mx-auto mb-6 rounded" />
          <Skeleton className="h-6 w-2/3 max-w-3xl mx-auto mb-10 rounded" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-14 w-64 rounded-lg" />
            <Skeleton className="h-14 w-64 rounded-lg" />
          </div>
        </section>

        <section className="bg-white py-16 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-10 w-20 mx-auto mb-2 rounded" />
                  <Skeleton className="h-4 w-24 mx-auto rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <Skeleton className="h-10 w-64 mx-auto mb-16 rounded" />
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center mb-6">
                  <Skeleton className="h-12 w-12 rounded-full mr-4" />
                  <Skeleton className="h-6 w-40 rounded" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-start">
                      <Skeleton className="h-5 w-5 mr-3 rounded-full" />
                      <Skeleton className="h-4 w-full rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-32 rounded" />
          </div>
          <Skeleton className="h-4 w-48 mx-auto rounded" />
        </div>
      </footer>
    </div>
  );
};

export default IndexSkeleton;