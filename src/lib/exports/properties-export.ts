export function normalizeExportProperty(property: any) {
  const media = Array.isArray(property.property_media)
    ? property.property_media
    : []

  const images = media
    .filter((item: any) => item.media_type === 'image')
    .sort((a: any, b: any) => {
      if (Boolean(a.is_cover) !== Boolean(b.is_cover)) {
        return a.is_cover ? -1 : 1
      }
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

  const plans = media
    .filter((item: any) => item.media_type === 'plan')
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return {
    id: property.id,
    reference_code: property.reference_code,
    title: property.title,
    slug: property.slug,
    public_url: property.slug ? `/immobili/${property.slug}` : null,

    status: property.status,
    contract_type: property.contract_type,
    property_type: property.property_type,
    condition: property.condition,
    availability: property.availability,

    price: property.price,
    surface: property.surface,
    rooms: property.rooms,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    total_floors: property.total_floors,

    province: property.province,
    comune: property.comune,
    frazione: property.frazione,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    location_mode: property.location_mode,

    energy_class: property.energy_class,
    energy_epgl: property.energy_epgl,
    heating_type: property.heating_type,
    heating_source: property.heating_source,
    furnished_status: property.furnished_status,

    condo_fees_amount: property.condo_fees_amount,
    condo_fees_period: property.condo_fees_period,
    condo_fees_note: property.condo_fees,

    has_garage: property.has_garage,
    has_parking: property.has_parking,
    has_garden: property.has_garden,
    has_elevator: property.has_elevator,
    is_auction: property.is_auction,

    description: property.description,

    export_targets: {
      immobiliare_it: Boolean(property.export_immobiliare_it),
      idealista: Boolean(property.export_idealista),
      casa_it: Boolean(property.export_casa_it),
    },

    images: images.map((item: any) => ({
      url: item.file_url,
      label: item.label,
      is_cover: Boolean(item.is_cover),
      sort_order: item.sort_order,
    })),

    plans: plans.map((item: any) => ({
      url: item.file_url,
      label: item.label,
      sort_order: item.sort_order,
    })),
  }
}
