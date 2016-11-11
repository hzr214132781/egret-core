//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

/**
 * @internal
 */
namespace elf {

    import blendModeMap = egret.sys.blendModeMap;
    import bitmapFillModeMap = egret.sys.bitmapFillModeMap;
    import gradientTypeMap = egret.sys.gradientTypeMap;
    import lineScaleModeMap = egret.sys.lineScaleModeMap;
    import capsStyleMap = egret.sys.capsStyleMap;
    import jointStyleMap = egret.sys.jointStyleMap;
    import textFieldTypeMap = egret.sys.textFieldTypeMap;
    import horizontalAlignMap = egret.sys.horizontalAlignMap;
    import verticalAlignMap = egret.sys.verticalAlignMap;
    import softKeyboardTypeMap = egret.sys.softKeyboardTypeMap;

    let tempRect = new egret.Rectangle();

    /**
     * @internal
     */
    export class Synchronizer {
        public static readUpdates(object:egret.DisplayObject):void {
            if (!object.$handle) {
                object.$handle = MakeNode(object, object.$nodeType);
            }
            if (object.$dirtyDescendents) {
                object.$dirtyDescendents = false;
                let children = object.$children;
                let length = children.length;
                for (let i = 0; i < length; i++) {
                    let child = children[i];
                    Synchronizer.readUpdates(child);
                }
            }
            if (object.$dirty) {
                object.$dirty = false;
                Synchronizer.updateDisplayObject(object);
                switch (object.$nodeType) {
                    case egret.sys.NodeType.Stage:
                        Synchronizer.updateStage(<egret.Stage><any>object);
                        break;
                    case egret.sys.NodeType.BITMAP:
                        Synchronizer.writeBitmap(<egret.Bitmap><any>object);
                        break;
                    case egret.sys.NodeType.GRAPHICS:
                        Synchronizer.updateGraphics(<egret.Shape><any>object);
                        break;
                    case egret.sys.NodeType.TEXT:
                        Synchronizer.updateTextField(<egret.TextField><any>object);
                        break;
                }
                if (object.$dirtyChildren) {
                    object.$dirtyChildren = false;
                    Synchronizer.updateChildren(<egret.DisplayObjectContainer><any>object);
                }
            }
        }

        private static updateChildren(container:egret.DisplayObjectContainer):void {
            let node:Node = container.$handle;
            let children = container.$children;
            if (container.$notEmpty) {
                let removedNodes:Node[] = container.$removedHandles;
                let addedIndices = container.$addedIndices;
                let addedNodes:Node[] = [];
                for (let index of addedIndices) {
                    let child = children[index];
                    addedNodes.push(child.$handle);
                }
                node.updateChildren(removedNodes, addedNodes, addedIndices);
                container.$addedIndices = [];
                container.$removedHandles = [];
                container.$notEmpty = (children.length > 0)
            }
            else {
                let nodes:Node[] = [];
                for (let child of children) {
                    nodes.push(child.$handle);
                }
                node.resetChildren(nodes);
            }
        }

        private static updateStage(stage:egret.Stage):void {
            let bits = stage.$stageBits;
            if (bits == 0) {
                return;
            }
            let node:Stage = stage.$handle;
            if (bits & egret.sys.StageBits.DirtyColor) {
                node.setColor(stage.$color);
            }
            if (bits & egret.sys.StageBits.DirtyDisplayRule) {
                node.setDisplayRule(stage.$displayRule);
            }
            if (bits & egret.sys.StageBits.DirtyFrameRate) {
                FPS.setFrameRate(stage.frameRate);
            }
            stage.$stageBits = 0;
        }

        private static updateDisplayObject(dp:egret.DisplayObject):void {
            let bits = dp.$displayObjectBits;
            if (bits === 0) {
                return;
            }
            let node:Node = dp.$handle;
            if (bits & egret.sys.DisplayObjectBits.DirtyMatrix) {
                node.matrix.copyFrom(<elf.Matrix><any>dp.getDisplayMatrix());
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyScrollRect) {
                node.setScrollRect(<elf.Rectangle><any>dp.$scrollRect);
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyFilters) {

            }
            if (bits & egret.sys.DisplayObjectBits.DirtyVisible) {
                node.visible = dp.$visible;
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyCacheAsBitmap) {
                node.setCacheAsBitmap(dp.$cacheAsBitmap);
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyAlpha) {
                node.alpha = dp.$alpha;
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyBlendMode) {
                node.setBlendMode(blendModeMap[dp.$blendMode] || 0);
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyMask) {
                let mask = dp.$mask;
                if (mask && !mask.$handle) {
                    mask.$handle = egret.sys.MakeNode(mask, mask.$nodeType);
                }
                node.setMask(mask.$handle);
            }
            if (bits & egret.sys.DisplayObjectBits.DirtyMaskRect) {
                node.setMaskRect(<elf.Rectangle><any>dp.$maskRect);
            }
            node.invalidateTransform();
            dp.$displayObjectBits = 0;
        }

        private static writeBitmap(bitmap:egret.Bitmap):void {
            let bits = bitmap.$bitmapBits;
            if (bits === 0) {
                return;
            }
            let node:Bitmap = bitmap.$handle;
            if (bits & egret.sys.BitmapBits.DirtyBitmapData) {
                let bitmapData = bitmap.$bitmapData;
                node.bitmapData = bitmapData ? bitmapData.$handle : null;
            }
            if (bits & egret.sys.BitmapBits.DirtyScale9Grid) {
                node.setScale9Grid(<elf.Rectangle><any>bitmap.$scale9Grid);
            }
            if (bits & egret.sys.BitmapBits.DirtySmoothing) {
                node.smoothing = bitmap.$smoothing;
            }
            if (bits & egret.sys.BitmapBits.DirtyFillMode) {
                node.fillMode = bitmapFillModeMap[bitmap.$fillMode] || 0;
            }
            node.invalidateContent();
            bitmap.$bitmapBits = 0;
        }

        private static updateGraphics(shape:egret.Shape):void {
            let graphics = shape.graphics;
            if (graphics.$commands.length == 0) {
                return;
            }
            let node:Graphics = shape.$handle;
            let commands = graphics.$commands;
            let args = graphics.$arguments;
            let index = 0;
            for (let command of commands) {
                switch (command) {
                    case egret.sys.GraphicsCommand.CLEAR:
                        node.clear();
                        break;
                    case egret.sys.GraphicsCommand.END_FILL:
                        node.endFill();
                        break;
                    case egret.sys.GraphicsCommand.BEGIN_FILL:
                        node.beginFill(args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.BEGIN_GRADIENT_FILL:
                        let type = gradientTypeMap[args[index++]] || 0;
                        let colors = args[index++];
                        let alphas = args[index++];
                        let ratios = args[index++];
                        let m = args[index++];
                        node.beginGradientFill(type, colors, alphas, ratios, <elf.Matrix><any>m);
                        break;
                    case egret.sys.GraphicsCommand.CUBIC_CURVE_TO:
                        node.cubicCurveTo(args[index++], args[index++], args[index++],
                            args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.CURVE_TO:
                        node.curveTo(args[index++], args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.DRAW_ARC:
                        node.drawArc(args[index++], args[index++], args[index++],
                            args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.DRAW_CIRCLE:
                        node.drawCircle(args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.DRAW_ELLIPSE:
                        node.drawEllipse(args[index++], args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.DRAW_RECT:
                        node.drawRect(args[index++], args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.DRAW_ROUND_RECT:
                        node.drawRoundRect(args[index++], args[index++], args[index++],
                            args[index++], args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.LINE_STYLE:
                        let thickness = args[index++];
                        let color = args[index++];
                        let alpha = args[index++];
                        let pixelHinting = args[index++];
                        let scaleMode = lineScaleModeMap[args[index++]] || 0;
                        let caps = capsStyleMap[args[index++]] || 0;
                        let joints = jointStyleMap[args[index++]] || 0;
                        let miterLimit = args[index++];
                        node.lineStyle(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit);
                        break;
                    case egret.sys.GraphicsCommand.LINE_TO:
                        node.lineTo(args[index++], args[index++]);
                        break;
                    case egret.sys.GraphicsCommand.MOVE_TO:
                        node.moveTo(args[index++], args[index++]);
                        break;
                }
            }
            node.invalidateContent();
            graphics.$measureContentBounds(tempRect);
            node.graphicsBounds.setTo(tempRect.x, tempRect.y, tempRect.width, tempRect.height);
            commands.length = 0;
            args.length = 0;
        }

        private static updateTextField(textField:egret.TextField):void {
            let bits = textField.$textFieldBits;
            if (bits === 0) {
                return;
            }
            let node:Text = textField.$handle;
            if (bits & egret.sys.TextFieldBits.DirtyType) {
                node.type = textFieldTypeMap[textField.$type] || 0;
            }
            if (bits & egret.sys.TextFieldBits.DirtyFontFamily) {
                node.fontFamily = textField.$fontFamily;
            }
            if (bits & egret.sys.TextFieldBits.DirtySize) {
                node.size = textField.$size;
            }
            if (bits & egret.sys.TextFieldBits.DirtyBold) {
                node.bold = textField.$bold;
            }
            if (bits & egret.sys.TextFieldBits.DirtyItalic) {
                node.italic = textField.$italic;
            }
            if (bits & egret.sys.TextFieldBits.DirtyTextAlign) {
                node.textAlign = horizontalAlignMap[textField.$textAlign] || 0;
            }
            if (bits & egret.sys.TextFieldBits.DirtyVerticalAlign) {
                node.verticalAlign = verticalAlignMap[textField.$verticalAlign] || 0;
            }
            if (bits & egret.sys.TextFieldBits.DirtyLineSpacing) {
                node.lineSpacing = textField.$lineSpacing;
            }
            if (bits & egret.sys.TextFieldBits.DirtyTextColor) {
                node.textColor = textField.$textColor;
            }
            if (bits & egret.sys.TextFieldBits.DirtyWordWrap) {
                node.wordWrap = textField.$wordWrap;
            }
            if (bits & egret.sys.TextFieldBits.DirtyStroke) {
                node.stroke = textField.$stroke;
            }
            if (bits & egret.sys.TextFieldBits.DirtyStrokeColor) {
                node.strokeColor = textField.$strokeColor;
            }
            if (bits & egret.sys.TextFieldBits.DirtyBorder) {
                node.border = textField.$border;
            }
            if (bits & egret.sys.TextFieldBits.DirtyBorderColor) {
                node.borderColor = textField.$borderColor;
            }
            if (bits & egret.sys.TextFieldBits.DirtyBackground) {
                node.background = textField.$background;
            }
            if (bits & egret.sys.TextFieldBits.DirtyBackgroundColor) {
                node.backgroundColor = textField.$backgroundColor;
            }
            if (bits & egret.sys.TextFieldBits.DirtyText) {
                node.text = textField.$text;
            }
            if (bits & egret.sys.TextFieldBits.DirtyDisplayAsPassword) {
                node.displayAsPassword = textField.$displayAsPassword;
            }
            if (bits & egret.sys.TextFieldBits.DirtyMaxChars) {
                node.maxChars = textField.$maxChars;
            }
            if (bits & egret.sys.TextFieldBits.DirtyMultiline) {
                node.multiline = textField.$multiline;
            }
            if (bits & egret.sys.TextFieldBits.DirtyPattern) {
                node.pattern = textField.$pattern;
            }
            if (bits & egret.sys.TextFieldBits.DirtySoftKeyboardType) {
                node.softKeyboardType = softKeyboardTypeMap[textField.$softKeyboardType] || 0;
            }
            node.invalidateContent();
            textField.$textFieldBits = 0;
        }

    }
}