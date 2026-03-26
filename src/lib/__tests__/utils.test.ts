import { describe, it, expect } from 'vitest'
import { titleCase } from '../utils'

describe('titleCase', () => {
  it('capitaliza cada palavra', () => {
    expect(titleCase('joão silva')).toBe('João Silva')
  })

  it('converte tudo maiúsculo para title case', () => {
    expect(titleCase('GABRIEL SASSAKI')).toBe('Gabriel Sassaki')
  })

  it('mantém preposições em minúscula', () => {
    expect(titleCase('vagner oliveira DE SOUZA miramontes')).toBe('Vagner Oliveira de Souza Miramontes')
    expect(titleCase('KLEBER TAVOLARO DE OLIVEIRA')).toBe('Kleber Tavolaro de Oliveira')
    expect(titleCase('camila cirilo de almeida')).toBe('Camila Cirilo de Almeida')
  })

  it('capitaliza preposição se for a primeira palavra', () => {
    expect(titleCase('de oliveira')).toBe('De Oliveira')
  })

  it('remove espaços extras', () => {
    expect(titleCase('  anny   teixeira  ')).toBe('Anny Teixeira')
  })

  it('funciona com nome já formatado', () => {
    expect(titleCase('Adriano Santos')).toBe('Adriano Santos')
  })
})
