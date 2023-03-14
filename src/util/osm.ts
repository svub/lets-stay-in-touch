import { ContactLocation, LocationPrecision } from "@/types/contacts";
import { NominatimResponse, reverseGeocode } from "nominatim-browser";

export async function locationMetadata(latitude: number, longitude: number, precision: LocationPrecision): Promise<ContactLocation> {
  const zoom = await getZoomLevel(precision);
  const lat = '' + latitude;
  const lon = '' + longitude;
  const data = (await reverseGeocode({ lat, lon, zoom })) as NominatimResponse;
  const label = getLabel(data, precision);
  return {
    label,
    precision,
    countryCode: data.address.country_code.toUpperCase(),
    lat: latitude,
    lng: longitude,
  };
}

async function getZoomLevel(precision: LocationPrecision) {
  // cf. https://nominatim.org/release-docs/develop/api/Reverse/
  switch (precision) {
    case LocationPrecision.continent: return 1;
    case LocationPrecision.country: return 3;
    case LocationPrecision.state: return 5;
    case LocationPrecision.city: return 10;
    case LocationPrecision.exact: return 17;
    default: throw new Error("Precision not defined!");
  }
}

function getLabel(data: NominatimResponse, precision: LocationPrecision) {
  const { address } = data;
  switch (precision) {
    case LocationPrecision.continent: return address.continent;
    case LocationPrecision.country: return address.country;
    case LocationPrecision.state: return address.state;
    case LocationPrecision.city: return address.city;
    case LocationPrecision.exact: return data.display_name;
    default: throw new Error("Precision not supported!");
  }
}