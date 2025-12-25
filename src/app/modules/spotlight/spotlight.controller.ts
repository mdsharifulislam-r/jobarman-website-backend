import { Request, Response, NextFunction } from 'express';
import { SpotlightServices } from './spotlight.service';
import catchAsync from '../../../shared/catchAsync';
import { getSingleFilePath } from '../../../shared/getFilePath';

const createSpotlight = catchAsync(async (req: Request, res: Response) => {
    const spotlight = req.body;
    const cover_image = getSingleFilePath(req.files, 'image');
    spotlight.contact_info = JSON.parse(spotlight.contact_info);
    spotlight.cover_image = cover_image!;
    spotlight.user = (req.user as any).id;

    
   const data = await SpotlightServices.createSpotlight(spotlight);
    res.status(200).json({
        success: true,
        message: 'Spotlight created successfully',
        data: data,
    });
});

const updateSpotlight = catchAsync(async (req: Request, res: Response) => {
    const spotlight = req.body;
    const id = req.params.id;
    const cover_image = getSingleFilePath(req.files, 'image');
    if (cover_image) {
        spotlight.cover_image = cover_image;
    }
    if(spotlight.contact_info){
        spotlight.contact_info = JSON.parse(spotlight.contact_info);
    }
    await SpotlightServices.updateSpotlight(id, spotlight);
    res.status(200).json({
        success: true,
        message: 'Spotlight updated successfully',
        data: spotlight,
    });
});

const deleteSpotlight = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    await SpotlightServices.deleteSpotlight(id);
    res.status(200).json({
        success: true,
        message: 'Spotlight deleted successfully',
    });
});

const approveSpotlight = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { status } = req.body;
    const spotlight = await SpotlightServices.approveSpotlight(id, status);
    res.status(200).json({
        success: true,
        message: `Spotlight ${status} successfully`,
        data: spotlight,
    });
});

const getSpotlights = catchAsync(async (req: Request, res: Response) => {
    const result = await SpotlightServices.getSpotlightsFromDB(req.query, (req.user as any));
    res.status(200).json({
        success: true,
        message: 'Spotlights fetched successfully',
        data: result?.stats? {
            stats: result.stats,
            spotlights: result.spotlights
        } : result?.spotlights,
        pagination: result?.pagination,
    });
});

export const SpotlightController = { createSpotlight, updateSpotlight, deleteSpotlight, approveSpotlight, getSpotlights };