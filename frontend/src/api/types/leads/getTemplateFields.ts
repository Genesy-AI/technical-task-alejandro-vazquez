export type LeadsGetTemplateFieldsInput = undefined

export type TemplateFieldGroup = 'Person' | 'Company' | 'Contact'

export type TemplateField = {
  key: string
  label: string
  group: TemplateFieldGroup
  example: string
}

export type LeadsGetTemplateFieldsOutput = TemplateField[]
