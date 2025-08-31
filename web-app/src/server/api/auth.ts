import z from 'zod'

// TODO: Bad file name?

export const AUTHENTICATOR_CODE_DIGITS = 6

export const refreshTokenPayloadSchema = z.object({
  email: z.string().email(),
  version: z.number(),
})
export type RefreshTokenPayload = z.infer<typeof refreshTokenPayloadSchema>
export const accessTokenPayloadSchema = z.object({
  email: z.string().email(),
})
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>
