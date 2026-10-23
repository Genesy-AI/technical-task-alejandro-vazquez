export interface Lead {
  firstName: string
  lastName?: string | null
  email?: string | null
  jobTitle?: string | null
  companyName?: string | null
  countryCode?: string | null
  phoneNumber?: string | null
  yearsAtCompany?: number | null
  linkedinUrl?: string | null
}

export type TemplateFieldGroup = 'Person' | 'Company' | 'Contact'

export interface TemplateField {
  key: keyof Lead
  label: string
  group: TemplateFieldGroup
  example: string
}

export const TEMPLATE_FIELDS: TemplateField[] = [
  { key: 'firstName', label: 'First name', group: 'Person', example: 'Ada' },
  { key: 'lastName', label: 'Last name', group: 'Person', example: 'Lovelace' },
  { key: 'jobTitle', label: 'Job title', group: 'Person', example: 'CTO' },
  { key: 'countryCode', label: 'Country code', group: 'Person', example: 'GB' },
  { key: 'companyName', label: 'Company', group: 'Company', example: 'Analytical Engines Ltd' },
  { key: 'yearsAtCompany', label: 'Years at company', group: 'Company', example: '3' },
  { key: 'email', label: 'Email', group: 'Contact', example: 'ada@example.com' },
  { key: 'phoneNumber', label: 'Phone number', group: 'Contact', example: '+44 20 7946 0958' },
  { key: 'linkedinUrl', label: 'LinkedIn URL', group: 'Contact', example: 'https://linkedin.com/in/ada' },
]

const templateFieldKeys = new Set<string>(TEMPLATE_FIELDS.map((field) => field.key))

export function generateMessageFromTemplate(template: string, lead: Lead): string {
  let message = template

  const templateVariables = template.match(/\{(\w+)\}/g) || []

  for (const variable of templateVariables) {
    const fieldName = variable.slice(1, -1)

    if (templateFieldKeys.has(fieldName)) {
      const fieldValue = lead[fieldName as keyof Lead]

      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        throw new Error(`Missing required field: ${fieldName}`)
      }

      message = message.replace(new RegExp(`\\{${fieldName}\\}`, 'g'), String(fieldValue))
    } else {
      throw new Error(`Unknown field in template: ${fieldName}`)
    }
  }

  return message
}
