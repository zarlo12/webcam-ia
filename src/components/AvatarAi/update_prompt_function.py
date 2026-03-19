#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('AvatarPhoto.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar la función getPromptByGender completa
old_function = '''  // Función para generar el prompt basado en el género seleccionado
  const getPromptByGender = (gender: string): string => {
    switch (gender) {
      case "hombre":
        return `Use this image "template.png" as the exact template and base design I will upload a photo of a person. Instructions: Replace ONLY the person in the template with the person from the uploaded photo. Keep the same pose, framing, camera angle, lighting, and body position. The face must match the uploaded person exactly (identity, skin tone, facial features). Blend the face naturally into the body so it looks realistic and professional. Text Change: Change the name "DIANA RUÍZ" to: "MARCO SALAZAR" Keep the same font, size, style, and position. Strict Rules: Do NOT change anything else in the image. Do NOT modify colors, background, logos, icons, layout, or design. Do NOT move or resize elements. Keep everything identical to the template.`;
      case "mujer":
        return `Use this image "template.png" as the exact template and base design I will upload a photo of a person. Instructions: Replace ONLY the person in the template with the person from the uploaded photo. Keep the same pose, framing, camera angle, lighting, and body position. The face must match the uploaded person exactly (identity, skin tone, facial features). Blend the face naturally into the body so it looks realistic and professional. Text Change: Change the name "DIANA RUÍZ" to: "MARCO SALAZAR" Keep the same font, size, style, and position. Strict Rules: Do NOT change anything else in the image. Do NOT modify colors, background, logos, icons, layout, or design. Do NOT move or resize elements. Keep everything identical to the template.`;
      default:
        return "-";
    }
  };'''

new_function = '''  // Función para generar el prompt basado en el género y nombre de la persona
  const getPromptByGender = (gender: string, name: string): string => {
    const basePrompt = `Use this image "template.png" as the exact template and base design I will upload a photo of a person. Instructions: Replace ONLY the person in the template with the person from the uploaded photo. Keep the same pose, framing, camera angle, lighting, and body position. The face must match the uploaded person exactly (identity, skin tone, facial features). Blend the face naturally into the body so it looks realistic and professional. Text Change: Change the name "DIANA RUÍZ" to: "${name.toUpperCase()}" Keep the same font, size, style, and position. Strict Rules: Do NOT change anything else in the image. Do NOT modify colors, background, logos, icons, layout, or design. Do NOT move or resize elements. Keep everything identical to the template.`;
    
    switch (gender) {
      case "hombre":
        return basePrompt;
      case "mujer":
        return basePrompt;
      default:
        return "-";
    }
  };'''

# Contar ocurrencias
count = content.count(old_function)
print(f'Encontradas {count} ocurrencias de la función antigua')

if count > 0:
    content = content.replace(old_function, new_function)
    print('Reemplazando función...')
    
    with open('AvatarPhoto.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print('✓ Función actualizada exitosamente')
else:
    print('⚠ No se encontró la función antigua, verificando formato...')
