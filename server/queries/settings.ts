import { db } from "@/lib/db";
import {
  companies,
  customerStatuses,
  industries,
  visitFrequencies,
  interactionTypes,
  eventTypes,
} from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function getAllCompanies() {
  return db.query.companies.findMany({ orderBy: [asc(companies.name)] });
}

export async function getAllCustomerStatuses() {
  return db.query.customerStatuses.findMany({
    orderBy: [asc(customerStatuses.name)],
  });
}

export async function getAllIndustries() {
  return db.query.industries.findMany({ orderBy: [asc(industries.name)] });
}

export async function getAllVisitFrequencies() {
  return db.query.visitFrequencies.findMany({
    orderBy: [asc(visitFrequencies.name)],
  });
}

export async function getAllInteractionTypes() {
  return db.query.interactionTypes.findMany({
    orderBy: [asc(interactionTypes.name)],
  });
}

export async function getAllSettingsData() {
  const [
    companiesList,
    customerStatusesList,
    industriesList,
    visitFrequenciesList,
    interactionTypesList,
    eventTypesList,
  ] = await Promise.all([
    getAllCompanies(),
    getAllCustomerStatuses(),
    getAllIndustries(),
    getAllVisitFrequencies(),
    getAllInteractionTypes(),
    db.query.eventTypes.findMany({
      orderBy: [asc(eventTypes.sortOrder), asc(eventTypes.name)],
    }),
  ]);

  return {
    companies: companiesList,
    customerStatuses: customerStatusesList,
    industries: industriesList,
    visitFrequencies: visitFrequenciesList,
    interactionTypes: interactionTypesList,
    eventTypes: eventTypesList,
  };
}
