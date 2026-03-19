#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

with open('AvatarPhoto.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar y modificar la función
new_lines = []
in_function = False
function_start = -1

for i, line in enumerate(lines):
    # Detectar el inicio del comentario de la función
    if '// Función para generar el prompt basado en el género' in line:
        in_function = True
        function_start = i
        newlines.append('  // Función para generar el prompt basado en el género y nombre de la persona\n')
        continue
    
    # Modificar la firma de la función
    if in_function and 'const getPromptByGender = (gender: string): string => {' in line:
        new_lines.append('  const getPromptByGender = (gender: string, name: string): string => {\n')
        continue
    
    # Agregar basePrompt antes del switch
    if in_function and 'switch (gender) {' in line:
        # Primero agregar la definición del basePrompt
        base_prompt_line = line.replace(
            'switch (gender) {',
            'const basePrompt = `Use this image "template.png" as the exact template and base design I will upload a photo of a person. Instructions: Replace ONLY the person in the template with the person from the uploaded photo. Keep the same pose, framing, camera angle, lighting, and body position. The face must match the uploaded person exactly (identity, skin tone, facial features). Blend the face naturally into the body so it looks realistic and professional. Text Change: Change the name "DIANA RUÍZ" to: "${name.toUpperCase()}" Keep the same font, size, style, and position. Strict Rules: Do NOT change anything else in the image. Do NOT modify colors, background, logos, icons, layout, or design. Do NOT move or resize elements. Keep everything identical to the template.`;\n    \n    switch (gender) {'
        )
        new_lines.append(base_prompt_line)
        continue
    
    # Reemplazar los returns con basePrompt
    if in_function and 'return `Use this image' in line:
        indent = '        '
        new_lines.append(f'{indent}return basePrompt;\n')
        continue
    
    # Fin de función
    if in_function and line.strip() == '};':
        in_function = False
    
    new_lines.append(line)

# Escribir el archivo modificado
with open('AvatarPhoto.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('✅ Función actualizada')
print(f'Total de líneas: {len(new_lines)}')
