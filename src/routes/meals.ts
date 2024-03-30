import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: checkSessionIdExists }, async (request, reply) => {
    const meals = await knex('meals').where({ user: request.user?.id }).select()

    return reply.send({ meals })
  })

  app.get(
    '/:mealId',
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        mealId: z.string().uuid(),
      })

      const { mealId } = getMealParamsSchema.parse(request.params)

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      return reply.send({ meal })
    },
  )

  app.put(
    '/:mealId',
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        mealId: z.string().uuid(),
      })

      const { mealId } = getMealParamsSchema.parse(request.params)

      const patchMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })

      const { name, description, date, isOnDiet } = patchMealBodySchema.parse(
        request.body,
      )

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id: mealId }).update({
        name,
        description,
        date: date.getTime(),
        is_on_diet: isOnDiet,
      })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:mealId',
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        mealId: z.string().uuid(),
      })

      const { mealId } = getMealParamsSchema.parse(request.params)

      const meal = await knex('meals').where({ id: mealId }).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ id: mealId }).delete()

      return reply.status(204).send()
    },
  )

  app.post(
    '/',
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        isOnDiet: z.boolean(),
      })

      const { name, description, date, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        date: date.getTime(),
        is_on_diet: isOnDiet,
        user: request.user?.id,
      })

      return reply.status(201).send()
    },
  )

  app.get(
    '/metrics',
    { preHandler: checkSessionIdExists },
    async (request, reply) => {
      const totalMeals = await knex('meals')
        .where({ user: request.user?.id })
        .orderBy('date', 'desc')
        .select()

      const mealsOnDiet = await knex('meals')
        .where({ user: request.user?.id, is_on_diet: true })
        .select()

      const mealsOffDiet = await knex('meals')
        .where({ user: request.user?.id, is_on_diet: false })
        .select()

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence += 0
          }
          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalMeals.length,
        mealsOnDiet: mealsOnDiet.length,
        mealsOffDiet: mealsOffDiet.length,
        bestOnDietSequence,
      })
    },
  )
}
