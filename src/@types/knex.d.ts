import 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id: string
      name: string
      email: string
      created_at: string
    }
    meals: {
      id: string
      name: string
      description: string
      date: number
      is_on_diet: boolean
      created_at: string
      user: string
    }
  }
}
