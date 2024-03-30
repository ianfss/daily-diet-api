import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should create a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'User',
        email: 'user@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)
  })

  it('should edit a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'User',
        email: 'user@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .send({
        name: 'Apple',
        description: 'Apple description',
        date: new Date(),
        isOnDiet: false,
      })
      .set('Cookie', cookies!)
      .expect(204)
  })

  it('should delete a meal', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'User',
        email: 'user@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', cookies!)
      .expect(204)
  })

  it('should list all meals of a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'User',
        email: 'user@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'Meal',
        description: 'Meal Description',
        date: expect.any(Number),
        is_on_diet: 1,
      }),
    ])
  })

  it('should list specific meal of a user', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'User',
        email: 'user@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies!)
      .expect(200)

    const mealId = listMealsResponse.body.meals[0].id

    const listMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies!)
      .expect(200)

    expect(listMealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Meal',
        description: 'Meal Description',
        date: expect.any(Number),
        is_on_diet: 1,
      }),
    })
  })

  it('should list meal metrics', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'User',
        email: 'user@example.com',
      })
      .expect(201)

    const cookies = createUserResponse.get('Set-Cookie')

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 1',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 2',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: true,
      })
      .set('Cookie', cookies!)
      .expect(201)

    await request(app.server)
      .post('/meals')
      .send({
        name: 'Meal 3',
        description: 'Meal Description',
        date: new Date(),
        isOnDiet: false,
      })
      .set('Cookie', cookies!)
      .expect(201)

    const listMealMetricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies!)
      .expect(200)

    expect(listMealMetricsResponse.body).toEqual(
      expect.objectContaining({
        totalMeals: 3,
        mealsOnDiet: 2,
        mealsOffDiet: 1,
        bestOnDietSequence: 2,
      }),
    )
  })
})
