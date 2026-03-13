"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import * as topojson from "topojson-client"
import { BonitaSidebar } from "@/components/BonitaSidebar"

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"

const LOCATIONS: { name: string; coords: [number, number]; searchName: string }[] = [
  { name: "South Bronx (NY)", coords: [-73.87, 40.82], searchName: "South Bronx" },
  { name: "Philadelphia (PA)", coords: [-75.17, 39.95], searchName: "Philadelphia" },
  { name: "Washington DC", coords: [-77.04, 38.91], searchName: "Washington DC" },
  { name: "Richmond (VA)", coords: [-77.44, 37.54], searchName: "Richmond" },
  { name: "Wilmington (NC)", coords: [-77.94, 34.21], searchName: "Wilmington" },
  { name: "Atlanta (GA)", coords: [-84.39, 33.75], searchName: "Atlanta" },
  { name: "New Orleans (LA)", coords: [-90.07, 29.95], searchName: "New Orleans" },
  { name: "Memphis (TN)", coords: [-90.05, 35.15], searchName: "Memphis" },
  { name: "Mississippi Delta (MS)", coords: [-90.5, 33.7], searchName: "Mississippi Delta" },
  { name: "Mobile (AL)", coords: [-88.04, 30.69], searchName: "Mobile" },
  { name: "Birmingham (AL)", coords: [-86.8, 33.52], searchName: "Birmingham" },
  { name: "Detroit (MI)", coords: [-83.05, 42.33], searchName: "Detroit" },
  { name: "Chicago South Side (IL)", coords: [-87.62, 41.78], searchName: "Chicago" },
  { name: "Indianapolis (IN)", coords: [-86.16, 39.77], searchName: "Indianapolis" },
  { name: "Cleveland (OH)", coords: [-81.69, 41.5], searchName: "Cleveland" },
  { name: "Oberlin (OH)", coords: [-82.22, 41.29], searchName: "Oberlin" },
  { name: "Kansas City (MO)", coords: [-94.58, 39.1], searchName: "Kansas City" },
  { name: "Ferguson (MO)", coords: [-90.3, 38.74], searchName: "Ferguson" },
  { name: "Minneapolis (MN)", coords: [-93.27, 44.98], searchName: "Minneapolis" },
  { name: "Nicodemus (KS)", coords: [-99.62, 39.39], searchName: "Nicodemus" },
  { name: "Greenwood District / Tulsa (OK)", coords: [-95.99, 36.15], searchName: "Greenwood Tulsa" },
  { name: "Fifth Ward / Houston (TX)", coords: [-95.33, 29.77], searchName: "Fifth Ward Houston" },
  { name: "Denver / Five Points (CO)", coords: [-104.98, 39.75], searchName: "Five Points Denver" },
  { name: "Oakland (CA)", coords: [-122.27, 37.8], searchName: "Oakland" },
  { name: "San Francisco (CA)", coords: [-122.42, 37.77], searchName: "San Francisco" },
  { name: "Seattle (WA)", coords: [-122.33, 47.61], searchName: "Seattle" },
  { name: "Lowcountry / Sea Islands (SC)", coords: [-80.67, 32.43], searchName: "Lowcountry Sea Islands" },
  { name: "Central Florida (FL)", coords: [-81.37, 28.54], searchName: "Central Florida" },
  { name: "Newark (NJ)", coords: [-74.17, 40.74], searchName: "Newark" },
  { name: "Boston (MA)", coords: [-71.06, 42.36], searchName: "Boston" },
  { name: "Loiza (Puerto Rico)", coords: [-65.88, 18.43], searchName: "Loiza" },
]

type RegionalEntry = {
  id: string
  state: string | null
  title: string
  content: string
  source: string | null
} | null

export default function MapPage() {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<typeof LOCATIONS[0] | null>(null)
  const [regionalEntry, setRegionalEntry] = useState<RegionalEntry>(null)
  const [loadingRegional, setLoadingRegional] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchRegional = useCallback(async (regionName: string) => {
    setLoadingRegional(true)
    setRegionalEntry(null)
    try {
      const res = await fetch(
        `/api/core/v1/knowledge/regional?region=${encodeURIComponent(regionName)}`,
      )
      const json = await res.json()
      if (json.ok && json.entry) setRegionalEntry(json.entry)
      else setRegionalEntry(null)
    } catch {
      setRegionalEntry(null)
    } finally {
      setLoadingRegional(false)
    }
  }, [])

  useEffect(() => {
    if (selectedLocation) fetchRegional(selectedLocation.searchName)
  }, [selectedLocation, fetchRegional])

  return (
    <div className="flex min-h-screen" style={{ background: "#080504" }}>
      <BonitaSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="relative z-10 flex flex-1 flex-col pl-0 lg:pl-[280px]">
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Map */}
          <div className="flex-1 min-h-[50vh] lg:min-h-[calc(100vh-0px)] p-4">
            {!mounted ? (
              <div className="flex h-full min-h-[320px] items-center justify-center" style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                Loading map...
              </div>
            ) : (
            <ComposableMap
              projection="geoAlbersUsa"
              projectionConfig={{ scale: 1000 }}
              className="w-full h-full"
              style={{ background: "transparent" }}
            >
              <Geographies
                geography={GEO_URL}
                parseGeographies={(topology: any) => {
                  if (!topology?.objects?.states) return []
                  try {
                    const fc = topojson.feature(topology, topology.objects.states)
                    const features = (fc as any)?.features
                    return Array.isArray(features) ? features : []
                  } catch {
                    return []
                  }
                }}
              >
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="transparent"
                      stroke="rgba(197, 150, 58, 0.15)"
                      strokeWidth={0.5}
                      style={{ outline: "none" }}
                    />
                  ))
                }
              </Geographies>
              {LOCATIONS.map((loc) => (
                <Marker key={loc.name} coordinates={loc.coords}>
                  <g
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => setSelectedLocation(loc)}
                    style={{ filter: "drop-shadow(0 0 6px rgba(197, 150, 58, 0.6))" }}
                  >
                    <circle
                      r={selectedLocation?.name === loc.name ? 5 : 4}
                      fill="#C5963A"
                      className={selectedLocation?.name === loc.name ? "animate-pulse" : ""}
                    />
                  </g>
                </Marker>
              ))}
            </ComposableMap>
            )}
          </div>

          {/* Side panel — 380px */}
          <aside
            className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col"
            style={{
              borderColor: "rgba(197, 150, 58, 0.2)",
              background: "var(--bg-card)",
            }}
          >
            <div className="p-6 flex-1 overflow-y-auto">
              {!selectedLocation ? (
                <div className="flex flex-col items-center justify-center text-center min-h-[240px]">
                  <div
                    className="mb-4 h-24 w-24 overflow-hidden rounded-full border-2"
                    style={{ borderColor: "var(--bonita-gold)" }}
                  >
                    <img
                      src="/Real_Bonita.png"
                      alt="Bonita"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const el = e.currentTarget
                        el.style.display = "none"
                        if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = "flex"
                      }}
                    />
                    <div
                      className="hidden h-full w-full items-center justify-center text-2xl font-bold italic"
                      style={{ background: "var(--bonita-burgundy)", color: "var(--bonita-gold-crown)", fontFamily: "var(--font-display)" }}
                    >
                      B
                    </div>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
                    Select a location to hear what Bonita knows.
                  </p>
                </div>
              ) : (
                <>
                  <h2
                    className="mb-4 text-xl font-semibold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                  >
                    {selectedLocation.name}
                  </h2>
                  {loadingRegional ? (
                    <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Loading...</p>
                  ) : regionalEntry?.content ? (
                    <div
                      className="prose prose-invert max-w-none text-sm leading-relaxed mb-6"
                      style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}
                    >
                      <p className="whitespace-pre-wrap">{regionalEntry.content}</p>
                    </div>
                  ) : (
                    <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontStyle: "italic" }}>
                      No regional entry yet for this place. Ask Bonita to learn more.
                    </p>
                  )}
                  <Link
                    href={`/?ask=${encodeURIComponent("Tell me more about " + selectedLocation.name)}`}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{
                      background: "var(--bonita-gold)",
                      color: "var(--bg-deep)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Ask Bonita more →
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
