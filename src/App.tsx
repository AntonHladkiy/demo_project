import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from "axios";
import {zodResolver} from '@hookform/resolvers/zod';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select, Slider,
    TextField,
} from '@mui/material';
import {boolean, nativeEnum, number, object, string, TypeOf} from 'zod';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';

const engineId = 'stable-diffusion-v1-5'
const apiHost = process.env.API_HOST ?? 'https://api.stability.ai'
const apiKey = process.env.REACT_APP_STABILITY_API_KEY

interface GenerationResponse {
    artifacts: Array<{
        base64: string
        seed: number
        finishReason: string
    }>
}

enum StylePresetEnum {
    '3d-model' = '3d-model',
    'analog-film' = 'analog-film',
    anime = 'anime',
    cinematic = 'cinematic',
    'comic-book' = 'comic-book',
    'digital-art' = 'digital-art',
    enhance = 'enhance',
    'fantasy-art' = 'fantasy-art',
    'pixel-art' = 'pixel-art'
}

const generateImageConfigSchema = object({
    text_prompts: string(),
    steps: number().min(10).max(150),
    style_preset: nativeEnum(StylePresetEnum),
});

type IGenerateImage = TypeOf<typeof generateImageConfigSchema>;


function App() {
    const [images, setImages] = useState<any[]>([])
    const [errorMessage, setErrorMessage] = useState('');
    const defaultValues: IGenerateImage = {
        text_prompts: "",
        steps: 50,
        style_preset: StylePresetEnum.enhance
    };
    const {control, handleSubmit, formState, register, getValues, setValue} =
        useForm<IGenerateImage>({
            resolver: zodResolver(generateImageConfigSchema),
            defaultValues,
        });
    const generateImage = async (prompts: IGenerateImage) => {
        if (!apiKey) throw new Error('Missing Stability API key.')
        console.log(prompts)
        const response = await axios(
            `${apiHost}/v1/generation/${engineId}/text-to-image`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                data: JSON.stringify({
                    text_prompts: [
                        {
                            text: prompts.text_prompts,
                        },
                    ],
                    steps: prompts.steps,
                    style_preset: prompts.style_preset
                }),
            }
        )
        if (response.status !== 200) {
            throw new Error(`Non-200 response: ${response.statusText}`)
        }


        const responseJSON = await response.data as GenerationResponse
        const imagesResponse: any[] = [];
        responseJSON.artifacts.forEach((image, index) => {
            imagesResponse.push(image.base64)
        })
        setImages(imagesResponse)
    }
    const onSubmitHandler: SubmitHandler<IGenerateImage> = async (
        values: IGenerateImage
    ) => {
        setErrorMessage('');
        await generateImage(values)
    };
    return (
        <div className="App">
            <header className="App-header">
                <Box
                    className="edit-broadcaster-form"
                    component="form"
                    onSubmit={handleSubmit(onSubmitHandler)}>
                    {!!errorMessage?.length && (
                        <Alert
                            severity="error"
                            sx={{marginBottom: '10px'}}
                            onClose={() => setErrorMessage('')}>
                            {errorMessage}
                        </Alert>
                    )}
                    <Controller
                        name="text_prompts"
                        control={control}
                        defaultValue={defaultValues.text_prompts}
                        render={({field: {ref, ...field}}) => (
                            <TextField
                                label="Text Prompt"
                                margin="normal"
                                size="medium"
                                fullWidth
                                multiline={true}
                                type="text"
                                error={Boolean(formState.errors.text_prompts)}
                                inputRef={ref}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="steps"
                        control={control}
                        defaultValue={defaultValues.steps}
                        render={({field: {ref, ...field}}) => (
                            <Slider
                                {...field}
                                onChange={(_, value) => {
                                    field.onChange(value);
                                }}
                                valueLabelDisplay="auto"
                                min={10}
                                max={150}
                                step={1}
                            />
                        )}
                    />
                    <Controller
                        name="style_preset"
                        control={control}
                        defaultValue={defaultValues.style_preset}
                        render={({field: {ref, ...field}}) => (
                            <div>
                                <FormControl variant="outlined">
                                    <InputLabel id="style-label">Style</InputLabel>
                                    <Select
                                        variant="outlined"
                                        value={field.value}
                                        labelId="style-label"
                                        label={'Style'}
                                        onChange={field.onChange}>
                                        {(
                                            Object.keys(StylePresetEnum) as Array<keyof typeof StylePresetEnum>
                                        ).map((key) => {
                                            return (
                                                <MenuItem key={key} value={key}>
                                                    {StylePresetEnum[key]}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                            </div>
                        )}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: 3, mb: 2, maxWidth: '100px'}}>
                        Submit
                    </Button>

                </Box>
                {images.map((image, index) => {
                    return <img key={index} src={`data:image/png;base64,${image}`}/>
                })}
            </header>
        </div>
    );
}

export default App;
