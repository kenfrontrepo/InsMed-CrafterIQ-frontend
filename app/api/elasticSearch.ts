const BASE_URL = process.env.ELASTIC_BASE_URL;
const API_KEY = process.env.ELASTIC_API_KEY;
const MAX_RESULTS = 25;

interface ElasticHit {
  _source: Record<string, string | undefined>;
}

interface ElasticSearchResponse {
  hits: {
    hits: ElasticHit[];
  };
}

async function searchIndex(
  index: string,
  field: string,
  filterVal: string
): Promise<ElasticHit[]> {
  if (!BASE_URL || !API_KEY) {
    console.error("Elastic search is not configured");
    return [];
  }

  try {
    const res = await fetch(`${BASE_URL}/${index}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${API_KEY}`,
      },
      body: JSON.stringify({
        query: filterVal.trim()
          ? {
              wildcard: {
                [field]: {
                  value: `*${filterVal}*`,
                  case_insensitive: true,
                },
              },
            }
          : { match_all: {} },
        size: MAX_RESULTS,
      }),
    });

    if (!res.ok) throw new Error(`Elastic search failed: ${res.status}`);
    const data: ElasticSearchResponse = await res.json();
    return data.hits.hits;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

export const elasticSearchService = {
  customerName: (filterVal: string) =>
    searchIndex("playpower_sales_customer_u00001", "CustomerName", filterVal),

  repAgency: (filterVal: string) =>
    searchIndex("playpower_sales_repagency_u00001", "RepAgency", filterVal),

  brandCategory: (filterVal: string) =>
    searchIndex("playpower_sales_brand_u00001", "UserBrandName", filterVal),

  getProductYear: (filterVal: string) =>
    searchIndex("playpower_sales_year_u00001", "OrderYear", filterVal),

  getOrderMonth: (filterVal: string) =>
    searchIndex("playpower_sales_month_u00001", "order_month", filterVal),

  getTerritory: (filterVal: string) =>
    searchIndex("playpower_sales_territory_u00001", "Territory", filterVal),

  salespersonName: (filterVal: string) =>
    searchIndex("playpower_sales_salespersonname_u00001", "SalesPersonName", filterVal),

  salesRegion: (filterVal: string) =>
    searchIndex("playpower_sales_region_u00001", "Region", filterVal),

  productCategory: (filterVal: string) =>
    searchIndex("playpower_sales_productcategory_u00001", "PRODUCT_CATEGORY", filterVal),

  opportunityIndustry: (filterVal: string) =>
    searchIndex("playpower_opps_industry_u00001", "industry", filterVal),

  opportunityAccountName: (filterVal: string) =>
    searchIndex("playpower_opps_accountname_u00001", "account_name", filterVal),

  opportunitySegment: (filterVal: string) =>
    searchIndex("playpower_opps_segment_u00001", "segment", filterVal),

  opportunityRegion: (filterVal: string) =>
    searchIndex("playpower_opps_region_u00001", "region", filterVal),

  opportunityStage: (filterVal: string) =>
    searchIndex("playpower_opps_stage_u00001", "stage", filterVal),

  opportunityForecastCategory: (filterVal: string) =>
    searchIndex("playpower_opps_forecastcategory_u00001", "forecast_category", filterVal),

  opportunityRepName: (filterVal: string) =>
    searchIndex("playpower_opps_repname_u00001", "rep_name", filterVal),
};

export interface SearchCategory {
  key: string;
  display: string;
  field: string;
  fetchMethod: (filterVal: string) => Promise<ElasticHit[]>;
}

export const SALES_SEARCH_CATEGORIES: SearchCategory[] = [
  {
    key: "brand",
    display: "Brand",
    field: "UserBrandName",
    fetchMethod: elasticSearchService.brandCategory,
  },
  {
    key: "territory",
    display: "Territory",
    field: "Territory",
    fetchMethod: elasticSearchService.getTerritory,
  },
  {
    key: "repAgency",
    display: "Rep Agency",
    field: "RepAgency",
    fetchMethod: elasticSearchService.repAgency,
  },
  {
    key: "salespersonName",
    display: "Salesperson Name",
    field: "SalesPersonName",
    fetchMethod: elasticSearchService.salespersonName,
  },
  {
    key: "customerName",
    display: "Customer Name",
    field: "CustomerName",
    fetchMethod: elasticSearchService.customerName,
  },
  {
    key: "region",
    display: "Region",
    field: "Region",
    fetchMethod: elasticSearchService.salesRegion,
  },
  {
    key: "productCategory",
    display: "Product Category",
    field: "PRODUCT_CATEGORY",
    fetchMethod: elasticSearchService.productCategory,
  },
  {
    key: "order_year",
    display: "Year",
    field: "OrderYear",
    fetchMethod: elasticSearchService.getProductYear,
  },
  {
    key: "Month",
    display: "Month",
    field: "order_month",
    fetchMethod: elasticSearchService.getOrderMonth,
  },
];

export const OPPORTUNITIES_SEARCH_CATEGORIES: SearchCategory[] = [
  {
    key: "industry",
    display: "Industry",
    field: "industry",
    fetchMethod: elasticSearchService.opportunityIndustry,
  },
  {
    key: "account_name",
    display: "Account Name",
    field: "account_name",
    fetchMethod: elasticSearchService.opportunityAccountName,
  },
  {
    key: "segment",
    display: "Segment",
    field: "segment",
    fetchMethod: elasticSearchService.opportunitySegment,
  },
  {
    key: "region",
    display: "Region",
    field: "region",
    fetchMethod: elasticSearchService.opportunityRegion,
  },
  {
    key: "stage",
    display: "Stage",
    field: "stage",
    fetchMethod: elasticSearchService.opportunityStage,
  },
  {
    key: "forecast_category",
    display: "Forecast Category",
    field: "forecast_category",
    fetchMethod: elasticSearchService.opportunityForecastCategory,
  },
  {
    key: "rep_name",
    display: "Rep Name",
    field: "rep_name",
    fetchMethod: elasticSearchService.opportunityRepName,
  },
];

export const SEARCH_CATEGORIES = SALES_SEARCH_CATEGORIES;

export function getSearchCategoriesBySchema(schemaName?: string): SearchCategory[] {
  if (schemaName?.toLowerCase() === "opportunities") {
    return OPPORTUNITIES_SEARCH_CATEGORIES;
  }
  return SALES_SEARCH_CATEGORIES;
}
